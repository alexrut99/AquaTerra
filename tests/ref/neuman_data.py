import json,sys
sys.path.insert(0,'.')
from neuman_ref import W_lap
import numpy as np
T,S,Sy,beta,Q,r,b=200.,1e-3,0.1,0.02,500.,30.,20.
ts=[1,2,3,5,8,12,20,30,50,80,120,200,300,500,800,1200,2000,3000,5000,10000]
d=[]
for t in ts:
    tsv=T*(t/1440)/(S*r*r); sc=Q/(4*np.pi*T)*W_lap(tsv,beta,S/Sy)
    d.append({'t':t,'s':round(float(b-np.sqrt(b*b-2*b*sc)),5)})
json.dump(dict(p=dict(T=T,S=S,Sy=Sy,beta=beta,Q=Q,r=r,b=b),data=d),open('neuman_data.json','w'))
print(d[0],d[-1])
