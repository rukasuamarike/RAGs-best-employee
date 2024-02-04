
import sys

# When you have d, decrypt the message. The message is a list of ascii characters
# encrypted by the public key (n, e). The resulting flag will form words and be obviously
# correct.

#euclid
def gcd(a, b):
    if (a == 0):
        return b
    return gcd(b % a, a)
#linear ext euclid
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
def pollard(n):
    a = 2
    i = 2
    # iterate until prime factor
    while(True):
        a = pow(a,i,n)
        d = gcd((a-1), n)
        # check if factor
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





# setup: get variables from file
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
# step 1: get P and Q
(p,q)=pfactor(int(n))
# step 2: phi from P Q
fn=(p-1)*(q-1)
# step 3: get d from extended euclidean (linear)
d = gcd_ext(int(e),fn)

# output and decrypt
res=[]
for c in cipher:
    # orig.append(chr(c))
    res.append(pow(c,d,int(n)))
print("".join([chr(c) for c in res]))
#add to flag.txt
print(f"P:{p} Q:{q} D:{d}")