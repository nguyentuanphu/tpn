# Northern Tiến lên rules review

27 October 2026 AEDT. Working branch only; not deployed.

Fixed ordinary same-colour pair legality, three-card suit-pattern matching, twos comparing across suits, four-of-a-kind cutting a single or pair of twos, and table-local mode isolation for local and online games. Southern rules retain their existing behavior. Passing remains locked until a new trick; existing trick reset logic retained.

Selected Northern conventions: spades < clubs < diamonds < hearts; singles and same-length runs match suit; ordinary pairs match colour; triples match all three suits. Runs exclude twos; consecutive pairs are not a Northern combination.

This remains a child-friendly adaptation: no betting, final-two/four-of-a-kind fines or disqualification. The game now explicitly explains that limit. Regional house rules vary; do not describe this as every Northern variant.

Sources reviewed: https://vi.wikipedia.org/wiki/Ti%E1%BA%BFn_l%C3%AAn (Northern section, article itself flags lack of citations), https://www.pagat.com/climbing/thirteen.html (general/Southern context, not independent proof of Northern specifics). Independent Northern source confirmation is still pending, as is human rules review. The corrected introduction and required English mixed-language fragments were recorded and fully decoded in run40481288711; human listening remains pending.

Dedicated tests cover every ordinary pair colour combination, all twos suit comparisons, matching/mismatched triples and runs, quads cutting twos, Southern compatibility and independent bot table modes.
