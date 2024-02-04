

# Now that you have φ(n) and e, write a script that uses the Extended Euclidean
# Algorithm to find d.


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