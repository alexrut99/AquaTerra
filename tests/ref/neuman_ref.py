# Independent reference for Neuman (1975): (a) published time-domain integral, (b) own Hankel-Laplace derivation.
import numpy as np, mpmath as mp, json
from scipy.integrate import quad
from scipy.optimize import brentq
from scipy.special import j0, exp1, k0
def W_time(ts,beta,sigma,Nmax=200):
    def integrand(y):
        if y==0: return 0.0
        # gamma0
        f0=lambda g: sigma*g*np.tanh(g)-(y*y-g*g)
        g0=brentq(f0,1e-14,y) if y>1e-14 else 0
        def term0():
            den=(y*y+(1+sigma)*g0*g0-(y*y-g0*g0)**2/sigma)*g0
            return (1-np.exp(-ts*beta*(y*y-g0*g0)))*np.tanh(g0)/den
        s=term0()
        for n in range(1,Nmax+1):
            lo=(2*n-1)*np.pi/2+1e-12; hi=n*np.pi-1e-12
            fn=lambda g: sigma*g*np.sin(g)+(y*y+g*g)*np.cos(g)
            gn=brentq(fn,lo,hi)
            den=(y*y-(1+sigma)*gn*gn-(y*y+gn*gn)**2/sigma)*gn
            t=(1-np.exp(-ts*beta*(y*y+gn*gn)))*np.tan(gn)/den
            s+=t
            if n>4 and abs(t)<1e-9*abs(s): break
        return 4*y*j0(y*np.sqrt(beta))*s
    sb=np.sqrt(beta)
    # split on J0 zeros (x=y*sqrt(beta)), and small-scale
    edges=[0]+[e/ sb for e in (0.01,0.1,0.5)]+[(k*np.pi+2.405)/sb for k in range(0,60)]
    tot=0
    for a,b in zip(edges[:-1],edges[1:]):
        tot+=quad(integrand,a,b,limit=60,epsabs=1e-7,epsrel=1e-6)[0]
    return tot
def W_lap(ts,beta,sigma,N=14):
    mp.mp.dps=40
    def Wbar(p):
        def G(x):
            eta=mp.sqrt((x*x+p)/beta); th=mp.tanh(eta)
            return (th/eta)/(beta*sigma*eta/p*th+1)
        f=lambda x: x*mp.besselj(0,x)*G(x)/(x*x+p)
        pts=[0,1e-4,1e-3,1e-2,1e-1,1]+[1+k*mp.pi for k in range(1,41)]
        I=mp.quad(f,pts,maxdegree=5)
        return 2/p*(mp.besselk(0,mp.sqrt(p))-I)
    return float(mp.invertlaplace(Wbar,ts,method='stehfest',degree=N))
if __name__=='__main__':
    cases=[(0.1,0.01,1e-3),(1,0.01,1e-3),(10,0.01,1e-3),(100,0.01,1e-3),(1e3,0.01,1e-3),(1e4,0.01,1e-3),(1e5,0.01,1e-3),(1e6,0.01,1e-3),
           (1,0.1,1e-2),(100,0.1,1e-2),(1e4,0.1,1e-2),(1,1,1e-2),(100,1,1e-2),(1e4,1,1e-2)]
    out=[]
    for ts,b,s in cases:
        a=W_lap(ts,b,s)
        c=W_time(ts,b,s)
        out.append(dict(ts=ts,beta=b,sigma=s,lap=a,time=c,th_S=float(exp1(1/(4*ts))),th_Sy=float(exp1(s/(4*ts)))))
        print(ts,b,s,'lap %.5f time %.5f  TheisS %.5f TheisSy %.5f'%(a,c,out[-1]['th_S'],out[-1]['th_Sy']),flush=True)
    json.dump(out,open('neuman_ref.json','w'))
