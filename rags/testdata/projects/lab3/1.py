


# Write a script to find the prime values for your n from the given file with various
# numbers. When you find p and q, you should be able to find φ(n).

#euclid
def gcd(a, b):
    if (a == 0):
        return b
    return gcd(b % a, a)

def pollard(n):
    a = 2
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