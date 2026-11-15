"""Cow-only closure textures in the body's original UVs (no frontal resampling).
Eye labels are measured from the real textured head, including its lateral sides.
"""
import numpy as np
from collections import deque


def grow(a):
    b=a.copy();b[1:]|=a[:-1];b[:-1]|=a[1:];b[:,1:]|=a[:,:-1];b[:,:-1]|=a[:,1:]
    return b


def filled(a):
    outside=np.zeros_like(a);todo=deque()
    for y,x in np.argwhere(~a):
        if y in (0,len(a)-1) or x in (0,a.shape[1]-1):outside[y,x]=1;todo.append((y,x))
    while todo:
        y,x=todo.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            u,v=y+dy,x+dx
            if 0<=u<a.shape[0] and 0<=v<a.shape[1] and not a[u,v] and not outside[u,v]:outside[u,v]=1;todo.append((u,v))
    return ~outside


def rle(a):
    d=np.diff(np.r_[False,a.ravel(),False].astype(np.int8));lo=np.flatnonzero(d==1);hi=np.flatnonzero(d==-1)
    return [int(v)for pair in zip(lo,hi-lo)for v in pair]


def prepare(o,px,center,r,coat):
    """Rasterize original head UV triangles; every sample has a real 3D source."""
    me=o.data;me.calc_loop_triangles();V=np.array([v.co[:]for v in me.vertices]);h,w=px.shape[:2];c=np.array(center)
    world=np.zeros((h,w,3));hit=np.zeros((h,w),bool);uvl=me.uv_layers.active.data
    for t in me.loop_triangles:
        v=V[list(t.vertices)];rad=np.linalg.norm(v[:,[0,2]]-c[[0,2]],axis=1)
        if rad.min()>r*2.4 or np.abs(v[:,1]-c[1]).min()>.1:continue
        uv=np.array([uvl[k].uv[:]for k in t.loops])*np.array((w,h))
        low=np.maximum(0,np.floor(uv.min(0)-.5).astype(int));high=np.minimum((w-1,h-1),np.ceil(uv.max(0)-.5).astype(int))
        if (high<low).any():continue
        yy,xx=np.mgrid[low[1]:high[1]+1,low[0]:high[0]+1];q=np.stack((xx+.5,yy+.5),axis=-1)
        a,b,d=uv;den=(b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])
        if abs(den)<1e-8:continue
        u=((q[...,0]-a[0])*(d[1]-a[1])-(q[...,1]-a[1])*(d[0]-a[0]))/den
        z=((b[0]-a[0])*(q[...,1]-a[1])-(b[1]-a[1])*(q[...,0]-a[0]))/den
        valid=(u>=-1e-5)&(z>=-1e-5)&(u+z<=1+1e-5)
        pos=v[0]+u[...,None]*(v[1]-v[0])+z[...,None]*(v[2]-v[0])
        valid&=(np.linalg.norm(pos[...,[0,2]]-c[[0,2]],axis=-1)<r*2.5)&(np.abs(pos[...,1]-c[1])<.1)
        iy,ix=yy[valid],xx[valid];world[iy,ix]=pos[valid];hit[iy,ix]=True
    lum=px@np.array((.3,.59,.11));sat=(px.max(-1)-px.min(-1))/np.maximum(px.max(-1),1e-6)
    rad=np.linalg.norm(world[...,[0,2]]-c[[0,2]],axis=-1)/r
    region=hit&(rad<1.55)
    native_cream=np.zeros((h,w),bool)
    if coat=='dark':
        cream=hit&(lum>.25)&(sat>.1)&(px[...,0]>=px[...,1])&(px[...,0]-px[...,1]<.18)&(px[...,1]>=px[...,2])&(px[...,1]-px[...,2]<.25)
        native_cream=cream&(rad>1.6);todo=deque(map(tuple,np.argwhere(native_cream)))
        while todo:
            y,x=todo.popleft()
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                a,b=y+dy,x+dx
                if 0<=a<h and 0<=b<w and cream[a,b] and not native_cream[a,b]:native_cream[a,b]=True;todo.append((a,b))
    if coat=='dark':
        feature=region&(((lum>.55)&(sat<.17))|((lum>.08)&(px[...,0]>px[...,1]*1.35)&(px[...,0]-px[...,1]>.05)&(px[...,0]-px[...,2]>.075)&(rad<1.2)))
        feature|=hit&(rad<.75)&(lum<.25)&(np.abs(world[...,1]-c[1])<.025)
        feature&=~native_cream
    else:
        dark=region&(lum<.38)
        pale=region&(lum>.64)&(sat<.17)
        feature=dark.copy();band=grow(dark)&pale
        for _ in range(20):band|=grow(band)&pale
        feature|=band
    if feature.sum()<8:raise ValueError('Missing actual UV eye artwork')
    # One texel joins the iris/sclera filtering footprint. Fill the enclosed
    # pupil as eye too, rather than misclassifying a black pupil as black fur.
    eye=filled(grow(feature))&hit&region&~native_cream
    p=world[eye];bounds=np.r_[p.min(0)-.002,p.max(0)+.002]
    rows,cols=np.where(eye);margin=24 if w>=1024 else 14
    x0=max(0,int(cols.min())-margin);y0=max(0,int(rows.min())-margin)
    n=int(max(cols.max()-x0+margin+1,rows.max()-y0+margin+1));n=min(n,w-x0,h-y0)
    if n<=0 or not eye[y0:y0+n,x0:x0+n].any():raise ValueError('Invalid UV eye crop')
    crop=(slice(y0,y0+n),slice(x0,x0+n));img=px[crop].copy();valid=hit[crop];opening=eye[crop];pos=world[crop]
    local_lum=lum[crop];local_sat=sat[crop];local_rad=rad[crop]
    # Remove the socket's AO along with its artwork, while preserving brow,
    # blush and coat boundaries. The UV metric is the actual texel spacing.
    repair=grow(opening);steps=9 if w>=1024 else 5
    if coat=='light':
        cream=(img[...,0]>=img[...,1])&(img[...,1]>=img[...,2])&(img[...,0]-img[...,1]<.12)&(img[...,1]-img[...,2]<.2)
        extra=valid&(local_rad<1.7)&cream&(local_lum<.86)
    else:extra=valid&(local_rad<1.7)&(local_sat<.18)&(local_lum>.20)
    for _ in range(steps):repair|=grow(repair)&extra&~native_cream[crop]
    guard=repair.copy()
    for _ in range(3):guard=grow(guard)
    if coat=='dark':known=valid&~guard&(local_lum>.025)&(local_lum<.25)&(local_sat<.45)
    else:known=valid&~guard&(local_lum>.65)&(local_sat>.12)&(local_sat<.32)
    if known.sum()<12:raise ValueError('Missing UV fur donors')
    # Local harmonic continuation and real donor grain. Pin untouched RGB;
    # copying native UVs means all exterior fur stays pixel-identical.
    field=img.copy();field[~known]=np.median(img[known],axis=0)
    for _ in range(n*4):
        avg=(np.roll(field,1,0)+np.roll(field,-1,0)+np.roll(field,1,1)+np.roll(field,-1,1))/4
        field=np.where(known[...,None],img,avg)
    blur=sum(np.roll(img,(dy,dx),(0,1))for dy in range(-2,3)for dx in range(-2,3))/25
    hp=img-blur;rng=np.random.default_rng(8100+(coat=='dark'));patches=[]
    for tile in (8,4):
        for y in range(0,n-tile,2):
            for x in range(0,n-tile,2):
                if known[y:y+tile,x:x+tile].all():patches.append(hp[y:y+tile,x:x+tile])
        if patches:break
    if not patches:raise ValueError('No native UV fur-grain patches')
    accum=np.zeros((n+tile,n+tile,3));den=np.zeros((n+tile,n+tile,1));win=np.outer(np.hanning(tile+2)[1:-1],np.hanning(tile+2)[1:-1])[...,None]
    for y in range(0,n,tile//2):
        for x in range(0,n,tile//2):
            patch=patches[int(rng.integers(len(patches)))];accum[y:y+tile,x:x+tile]+=patch*win;den[y:y+tile,x:x+tile]+=win
    grain=(accum/np.maximum(den,1e-9))[:n,:n]
    field=np.clip(field+grain*.7,0,1)
    correction=repair.astype(float);band=repair.copy()
    for k in range(1,4):
        nxt=grow(band);correction[nxt&~band]=.5+.5*np.cos(np.pi*k/4);band=nxt
    correction[native_cream[crop]]=0
    fill=img*(1-correction[...,None])+field*correction[...,None]
    alpha=band.astype(float);band2=grow(band);alpha[band2&~band]=.5
    # Every original eye/filter texel must be opaque.
    if not (alpha[grow(opening)&valid]>.999).all():raise ValueError('Incomplete UV eye guard')
    return dict(fill=fill,alpha=alpha,world=pos,valid=valid,opening=opening,eyeUV=[w,h]+rle(eye),bounds=bounds,origin=(x0,y0),size=n,bodySize=(w,h),source=img)


def supersample(data,factor=3):
    n=data['size'];N=n*factor;v=(np.arange(N)+.5)/factor-.5;yy,xx=np.meshgrid(v,v,indexing='ij');x0=np.floor(xx).astype(int);y0=np.floor(yy).astype(int);fx=(xx-x0)[...,None];fy=(yy-y0)[...,None]
    x0=np.clip(x0,0,n-1);y0=np.clip(y0,0,n-1);x1=np.clip(x0+1,0,n-1);y1=np.clip(y0+1,0,n-1)
    def resample(a,rgb=False):
        scalar=a.ndim==2
        if scalar:a=a[...,None]
        if rgb:a=np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
        out=(a[y0,x0]*(1-fx)+a[y0,x1]*fx)*(1-fy)+(a[y1,x0]*(1-fx)+a[y1,x1]*fx)*fy
        if rgb:out=np.where(out<=.0031308,out*12.92,1.055*np.maximum(out,0)**(1/2.4)-.055)
        return out[...,0]if scalar else out
    pos=data['world'].copy();known=data['valid'].copy()
    # Continue positions into the UV gutter, so a line crossing an island seam
    # receives the same antialiasing rather than falling off a zero-valued map.
    for _ in range(10):
        total=np.zeros_like(pos);den=np.zeros(known.shape)
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            k=np.roll(known,(dy,dx),(0,1));total+=np.roll(pos,(dy,dx),(0,1))*k[...,None];den+=k
        new=~known&(den>0);pos[new]=total[new]/den[new,None];known|=new
    data['fill']=resample(data['fill'],True);data['alpha']=resample(data['alpha']);data['world']=resample(pos);data['valid']=resample(known.astype(float))>.99;data['scale']=factor
    return data


def expression(data,c,r,kind,coat):
    img=data['fill'].copy();pos=data['world'];x=pos[...,0]-c[0];y=pos[...,2]-c[2];ew=r*.78;u=np.abs(x/(ew*.85));t=np.sqrt(np.maximum(0,1-u*u))
    curve=(-.1*r+.3*r*(x/ew)**2)if kind=='shut' else(.1*r-.45*r*(x/ew)**2)
    # Estimate the physical width of an actual UV texel in this head island.
    dp=np.linalg.norm(pos[1:,1:]-pos[:-1,:-1],axis=-1);good=data['valid'][1:,1:]&data['valid'][:-1,:-1];pixel=float(np.median(dp[good]))/1.414 if good.any() else .001
    pixel=max(.00025,min(.002,pixel));a=np.clip((r*.06*t-np.abs(y-curve))/(pixel*1.5)+.5,0,1)*(u<1)*data['valid']
    if coat=='dark':
        hi=np.clip((r*.025*t-np.abs(y-curve-r*.055*t))/(pixel*1.5)+.5,0,1)*(u<1)*data['valid']*.65
        img=img*(1-hi[...,None])+np.array((.40,.38,.35))*hi[...,None]
    img=img*(1-a[...,None])+np.array((.025,.018,.012))*a[...,None]
    return img
