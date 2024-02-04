import sys
#euclid
def gcd(a, b):
    if (a == 0):
        return b
    return gcd(b % a, a)
#extended euclid for mod inverse
def gcd_ext(a,n):
    x,x1,r,r1=0,1,n,a
    while(not(r1 == 0)):
        quotient = r//r1
        (x,x1)=(x1,x-quotient*x1)
        (r,r1)=(r1,r-quotient*r1)
    if(r>1):
        print("not invertible")
    if(x<0):
        x=x+n
    return x
#find prime factors method 1: eulers
def phi(n):
    res=1
    for i in range(2,n):
        if(gcd(n,i)==1):
            res+=1
    return res

#find prime factors method 2: pollard
def pollard(n):
   # defining base
    a = 2
    # defining exponent
    i = 2
    # iterate until a prime factor is obtained
    while(True):
        a = pow(a,i,n)
        d = gcd((a-1), n)
        # check if factor obtained
        if (d > 1):
            return d
            break
        i += 1
def pfactor(n):
    res=[]
    while(True):
        d = pollard(n)
        res.append(d)
        r= n//d
        if(r==2 or gcd(r,2)==1):
            res.append(r)
            break
        else:
            n=r
    return res


# step 1: phi from P and Q
def fn(p,q):
    return (p-1)*(q-1)

#step 2: decrypt with e, phi
# (e,phi)=(3,40)
# print(gcd_ext(e,phi))

#step 3: get p,q
# fn=phi(n)

def dec(c,d,n):
    return pow(c,d,n)

# parse textfile
n,e,cipher=0,0,[]
with open(sys.argv[1],"r") as fp:
    for line in fp:
        if("n:" in line):
            n=line.strip().split(' ')[1]
        if("e:" in line):
            e=line.strip().split(' ')[1]
        if("ciphertext:" in line):
            cipher.extend(int(c) for c in line[line.index('[')+1:line.index(']')].strip().split(','))
    print(n,e,cipher)
    
#step 4: full decrypt
fn=phi(int(n))
d = gcd_ext(int(e),fn)
res=[]
for c in cipher:
    res.append(dec(c,d,int(n)))
print([chr(c) for c in res])
print(f"P:{p} Q:{q} D:{d}")





