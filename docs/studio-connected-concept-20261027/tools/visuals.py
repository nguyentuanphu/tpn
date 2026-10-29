"""Create original concept diagrams, fictional charts and an offline review page."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'images';OUT.mkdir(exist_ok=True)
P='#6552b5';T='#147e7b';INK='#253149';MUTED='#596679';AMBER='#a36616';BG='#f7f7fa'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':MUTED,'xtick.color':MUTED,'ytick.color':MUTED,'text.color':INK,'axes.titlecolor':INK})
def canvas(title,subtitle):
 fig,ax=plt.subplots(figsize=(14,8));fig.patch.set_facecolor(BG);ax.set(xlim=(0,14),ylim=(0,8));ax.axis('off')
 fig.subplots_adjust(left=.02,right=.98,bottom=.02,top=.98)
 ax.text(.35,7.5,title,size=23,weight='bold');ax.text(.35,7.08,subtitle,size=12,color=MUTED)
 return fig,ax
def box(ax,x,y,w,h,title,body,color=P):
 ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.02,rounding_size=0.12',facecolor='white',edgecolor='#d8dce6',lw=1.2))
 ax.plot([x+.15,x+w-.15],[y+h-.07]*2,color=color,lw=3)
 ax.text(x+.2,y+h-.42,title,size=14,weight='bold',color=color)
 ax.text(x+.2,y+h-.78,body,size=11.5,va='top',linespacing=1.5)
def arrow(ax,start,end,label='',color=MUTED,dy=.15):
 ax.add_patch(FancyArrowPatch(start,end,arrowstyle='-|>',mutation_scale=15,color=color,lw=1.5))
 if label:ax.text((start[0]+end[0])/2,(start[1]+end[1])/2+dy,label,ha='center',size=10,color=color,bbox=dict(facecolor=BG,edgecolor='none',pad=2))
def save(fig,name):
 fig.savefig(OUT/(name+'.png'),dpi=150);fig.savefig(OUT/(name+'.svg'));plt.close(fig)

fig,ax=canvas('One Studio, three connected experiences','Concept architecture • Current and proposed paths are distinguished in the connection register')
box(ax,.35,4.75,3.7,1.8,'PUBLIC WEBSITE','Parent explanations / guides\nAllowlisted engagement counts\nPlay clicks ≠ confirmed game starts',T)
box(ax,4.95,4.75,3.9,1.8,'PRIVATE STUDIO','People · Content · Work · Money\nAuthorised views and controls\nReview, sources and coverage')
box(ax,9.7,4.75,3.85,1.8,'GAME ON DEVICES','Local profiles and saved progress\nPermitted usage / problem reports\nPublic content and configuration',T)
box(ax,.35,1.65,3.7,1.65,'REVIEWED SOURCE','Catalogue IDs + source revision\nGame / website build review\nL04: shared facts; editorial review',P)
box(ax,4.95,1.65,3.9,1.65,'PRIVATE SERVER SERVICES','SQL: events, changes, money\nBlobs: existing reports / counts\nServer permissions and audit',P)
box(ax,9.7,1.65,3.85,1.65,'PUBLIC DELIVERY','Allowlisted configuration snapshot\nRevision + effective hash\nL05 out / L06 receipt back',T)
arrow(ax,(4.05,5.7),(4.95,5.7),'L03 counts',dy=.32)
arrow(ax,(9.7,5.7),(8.85,5.7),'L01/02/07',dy=.32)
arrow(ax,(6.9,4.75),(6.9,3.3),'private reads / writes',dy=0)
arrow(ax,(4.05,2.5),(4.95,2.5),'source IDs',dy=.3)
arrow(ax,(8.85,2.5),(9.7,2.5),'approved',dy=.3)
arrow(ax,(11.62,3.3),(11.62,4.75),'fetch / acknowledge',dy=0)
arrow(ax,(2.2,3.3),(2.2,4.75),'reviewed public build',dy=0)
ax.text(.4,.83,'Separate identities: website aggregate ≠ installation ≠ profile ≠ session ≠ play attempt',size=14,weight='bold')
ax.text(.4,.35,'Child names, family photos, finance, credentials and operator audit stay out of public content/configuration.',size=11.5,color=MUTED)
save(fig,'system')

fig,ax=canvas('Understand the user before counting the user','Fictional example • Device-local relationships do not establish a global unique child')
box(ax,.4,4.15,3.65,2.15,'REPORTING INSTALLATION A','Browser storage ID: demo-A\nDevice label: shared tablet\n2 local profiles: Linh and Minh\nL01 usage / L02 optional events')
box(ax,5.1,4.15,3.65,2.15,'PROFILE ON A','Local profile: demo-p1\nReported first name: Linh\nName can be omitted / disabled\nKey: installation + local profile',T)
box(ax,9.8,4.15,3.65,2.15,'SESSION AND ATTEMPT','Session: one running tab\nAttempt: one activity lifecycle\nTwo participants ≠ two attempts\nJoin: device + attemptId')
arrow(ax,(4.05,5.2),(5.1,5.2),'contains',dy=.25)
arrow(ax,(8.75,5.2),(9.8,5.2),'participates',dy=.25)
box(ax,.4,1.2,3.65,1.85,'REPORTING INSTALLATION B','Browser storage ID: demo-B\nFirst name also says Linh\nNo automatic merge with A',AMBER)
box(ax,5.1,1.2,3.65,1.85,'WEBSITE OBSERVATION','Route / language / device class\nAggregate views and clicks\nNo current visitor-to-profile join',AMBER)
box(ax,9.8,1.2,3.65,1.85,'PRIVATE FAMILY ACCESS','Explicit service membership\nSeparate photo/save authority\nStatistics digest grants no access',T)
ax.text(.4,.5,'People detail shows what was reported, when, from which device, with which permission and coverage.',size=12.5,weight='bold')
save(fig,'identity')

fig,ax=canvas('A control explains its whole journey','Example: feature availability • No live action is performed by this concept')
box(ax,.4,4.25,3.65,2,'1  UNDERSTAND','Feature: reading activities\nCurrent value / selected rule\nScope: global publication\nExplain supported applicability')
box(ax,5.1,4.25,3.65,2,'2  REVIEW AND SAVE','Preview game / website impacts\nCheck permission and revision\nReason + before/after audit\nSaved = private transaction',T)
box(ax,9.8,4.25,3.65,2,'3  CONFIRM DELIVERY','Public readback = available\nMatching receipt = persisted\nNo receipt = unconfirmed\nOpen screens may refresh later')
arrow(ax,(4.05,5.3),(5.1,5.3),'K03',dy=.25)
arrow(ax,(8.75,5.3),(9.8,5.3),'L05 / L06',dy=.25)
box(ax,.4,1.1,3.65,1.9,'IF THE EDIT CONFLICTS','Keep draft; reload and compare\nNever overwrite another edit\nexpectedRevision rejects stale save',AMBER)
box(ax,5.1,1.1,3.65,1.9,'IF PUBLICATION FAILS','Saved / pending projection\nObserve and retry safely\nDo not claim universally live',AMBER)
box(ax,9.8,1.1,3.65,1.9,'IF DEVICE IS OFFLINE','Available / unconfirmed\nKeep fixed reporting cohort\nNo invented failure or success',AMBER)
ax.text(.4,.45,'Publishing configuration, deploying game code and editing a local save are different actions and permissions.',size=12.5,weight='bold')
save(fig,'control')

synthetic={'label':'FICTIONAL DESIGN DATA — not measured project performance','days':['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
 'reporting_installations':[38,44,41,55,60,78,72], 'play_minutes':[420,500,460,630,690,960,850],
 'website':{'page_view_events':920,'play_click_events':168},'game':{'reportable_boot_starts':121,'ready':99,'failed':8,'pending_unknown':14},
 'delivery':{'fixed_cohort':40,'applied_exact':28,'rejected':3,'unsupported':1,'unconfirmed':8},
 'costs':{'currency':'AUD','coverage':'Partial fictional ledger','hosting':[38,40,43],'voice':[12,24,17],'ci':[8,10,9],'months':['Jul','Aug','Sep']}}
(ROOT/'synthetic-data.json').write_text(json.dumps(synthetic,indent=2)+'\n')
fig,axs=plt.subplots(2,2,figsize=(14,10));fig.patch.set_facecolor(BG);fig.subplots_adjust(left=.075,right=.96,bottom=.22,top=.85,hspace=.72,wspace=.3)
fig.suptitle('More graphs, each answering a specific question',x=.075,y=.97,ha='left',fontsize=23,weight='bold')
fig.text(.075,.91,synthetic['label'],color=AMBER,size=12,weight='bold')
ax=axs[0,0];ax.plot(synthetic['days'],synthetic['reporting_installations'],color=P,lw=3,marker='o');ax.fill_between(range(7),synthetic['reporting_installations'],alpha=.09,color=P)
ax.set_title('G01  How many installations report active play?',loc='left',fontsize=12,pad=13);ax.set_ylabel('Active installations');ax.set_ylim(0,90);ax.grid(axis='y',alpha=.15)
ax=axs[0,1];ax.barh(['Website views','Website Play clicks'],[920,168],color=[T,P]);ax.set_title('G05/06  What happens on the website?',loc='left',fontsize=13,pad=13);ax.set_xlabel('Aggregate events; NOT a matched user funnel');ax.invert_yaxis();ax.grid(axis='x',alpha=.15)
ax=axs[1,0];values=[28,3,1,8];labels=['Applied','Rejected','Unsupported','Unconfirmed'];colors=[T,'#b66450','#9b8eaf','#b9c2cf'];left=0
for value,label,color in zip(values,labels,colors):
 ax.barh(['Selected revision'],[value],left=left,label=f'{label} {value}',color=color);left+=value
ax.set_yticks([]);ax.set_xlim(0,40);ax.set_title('G17  Did this configuration reach its cohort?',loc='left',fontsize=13,pad=13);ax.set_xlabel('Fixed cohort of 40 reporting installations');ax.legend(loc='upper left',bbox_to_anchor=(0,-.3),ncol=2,frameon=False,fontsize=10)
ax=axs[1,1];c=synthetic['costs'];x=range(3);ax.bar(x,c['hosting'],color=P,label='Hosting');ax.bar(x,c['voice'],bottom=c['hosting'],color=T,label='Voice');ax.bar(x,c['ci'],bottom=[a+b for a,b in zip(c['hosting'],c['voice'])],color='#c2b3e3',label='CI');ax.set_xticks(list(x),c['months']);ax.set_ylabel('AUD · fictional partial ledger');ax.set_title('G20  What recorded costs are changing?',loc='left',fontsize=13,pad=13);ax.legend(frameon=False,fontsize=10);ax.grid(axis='y',alpha=.15)
fig.text(.075,.027,'Each graph links to its definition, source fields, permitted detail, coverage and applicable controls.',size=12,color=MUTED)
fig.canvas.draw()
for i,ax in enumerate(axs.flat,1):
 bounds=ax.get_tightbbox(fig.canvas.get_renderer()).expanded(1.025,1.08).transformed(fig.dpi_scale_trans.inverted())
 fig.savefig(OUT/f'graph-{i}.png',dpi=150,bbox_inches=bounds,facecolor=BG)
save(fig,'graphs')

registry=json.loads((ROOT/'registry.json').read_text())
template=(ROOT/'tools/review-template.html').read_text()
template=template.replace('<img src="images/graphs.png" alt="Four fictional charts: reporting installations, separate website event counts, exact configuration receipt states, and partial recorded costs">','<p class="tag">All chart values below are fictional, not measured project performance.</p><div class="chartgrid">'+''.join(f'<img src="images/graph-{i}.png" alt="Fictional example: {label}">' for i,label in enumerate(['reporting active installations','separate website event counts, not a matched funnel','exact receipt states in a fixed reporting cohort','recorded costs in a partial ledger'],1))+'</div><p class="small"><a href="images/graphs.png">Open full-size chart board</a></p>')
template=template.replace('.columns{','.chartgrid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.columns{',1)
template=template.replace('.columns{grid-template-columns:1fr}', '.columns,.chartgrid{grid-template-columns:1fr}')
for name in ['system','identity','control']:
 needle=f'src="images/{name}.png"'
 # Add an explicit full-size link after this original diagram image.
 import re
 template=re.sub(r'(<img '+re.escape(needle)+r'[^>]*>)',r'\1'+f'<p class="small"><a href="images/{name}.png">Open full-size diagram</a></p>',template)
embedded=json.dumps(registry,ensure_ascii=False).replace('<','\\u003c')
(ROOT/'review.html').write_text(template.replace('__REGISTRY__',embedded))
print('Created four original diagrams/charts (PNG/SVG), synthetic data and offline review page.')
