import json, numpy as np
from scipy.special import exp1
from scipy.integrate import quad
import mpmath as mp
def W(u): return float(exp1(u))
def WH(u,rB):
    f=lambda y: mp.e**(-y-rB*rB/(4*y))/y
    return float(mp.quad(f,[u,u*10,u*100,1,10,mp.inf] if u<1 else [u,u+10,mp.inf]))
T,S,Q,r,b=200.,1e-4,500.,50.,20.
ts=[1,2,3,5,7,10,15,20,30,45,60,90,120,180,240,360,480,600,720]
d={}
d['W_u']=[1e-10,1e-6,1e-4,0.01,0.1,0.5,0.99,1.0,1.01,2,5,10,50,300]
d['W_ref']=[W(u) for u in d['W_u']]
d['H_cases']=[[1e-6,0.01],[1e-5,0.01],[1e-4,0.01],[1e-3,0.05],[0.01,0.05],[0.01,0.1],[0.045,0.1],[0.1,0.1],[0.1,0.5],[1,0.5],[1e-4,1],[1e-3,1],[0.01,2],[1,2]]
d['H_ref']=[WH(u,rB) for u,rB in d['H_cases']]
us=lambda t,r=r,T=T,S=S:r*r*S/(4*T*t/1440)
d['theis']=[{'t':t,'s':round(Q/(4*np.pi*T)*W(us(t)),5)} for t in ts]
# recovery
tp=480.
ts2=[1,2,5,10,20,30,60,90,120,180,240,360,480]
d['rec']=[{'t':t,'s':round(Q/(4*np.pi*T)*(W(us(tp+t))-W(us(t))),5)} for t in ts2]
# hantush B=500
B=500.
d['hant']=[{'t':t,'s':round(Q/(4*np.pi*T)*WH(us(t),r/B),5)} for t in ts]
# multi
d['mw']=[{'r':rr,'data':[{'t':t,'s':round(Q/(4*np.pi*T)*W(us(t,rr)),5)} for t in ts]} for rr in [20,50,120]]
# dist dd @120 min
rs=[5,10,20,50,100,200]
d['dd']=[{'r':rr,'s':round(Q/(4*np.pi*T)*W(us(120,rr)),5)} for rr in rs]
# superposition: 2 wells at (0,0) Q500 start0; (100,0) Q300 start 60min; obs (50,50); stepchange
sp=[]
for tm in [30,60,120,360,720]:
    tot=0
    for (x,y,Qi,t0) in [(0,0,500,0),(100,0,300,60)]:
        if tm>t0:
            rr=np.hypot(50-x,50-y); tot+=Qi/(4*np.pi*T)*W(rr*rr*S/(4*T*(tm-t0)/1440))
    sp.append({'t':tm,'s':tot})
d['sp']=sp
d['sw']=[{'t':t,'s':round(Q/(4*np.pi*T)*W(us(t,0.15)),5)} for t in ts]
# unconfined late-time: T=200,Sy=0.1,r=30,b=20; s'=theis -> s from s'
def s_from_sc(sc,b=20.): return b-np.sqrt(b*b-2*b*sc)
d['unc']=[{'t':t,'s':round(float(s_from_sc(Q/(4*np.pi*T)*W(30*30*0.1/(4*T*t/1440)))),5)} for t in [60,90,120,180,240,360,480,720,1000,1440,2000,2880,4000,5760,7000,10080]]
# step B=0.001 C=2e-6
d['step']=[{'step':i+1,'Q':q,'s':0.001*q+2e-6*q*q} for i,q in enumerate([200,400,600,800,1000])]
# slug: K=1 m/d Hvorslev
d['params']=dict(T=T,S=S,Q=Q,r=r,b=b,B=B,tp=tp)
json.dump(d,open('ref.json','w'))
print({k:(len(v) if hasattr(v,'__len__') else v) for k,v in d.items()})
print('s range theis',d['theis'][0],d['theis'][-1]); print('u for rw at 1 min', us(1,0.15))
print('dd',d['dd'])
