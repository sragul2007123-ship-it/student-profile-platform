name,balance="siva",500
print("before interest:",balance)
balance+= (7/100*500)
print("after interest:",balance)
print(type(balance))
print("s:",ord("s"))
a="S"
b="s"

print(a<b)

print(a>b)

print("S:",ord('S'))
a=5
b=7
print(a,b)
temp=a
a=b
b=temp
print(a,b)
a,b=b,a
print(a,b) 
lst = [1,2,3,4,5]
print(5 in lst)
name = "ragul peak"
print('r'in name)
numbers = [1,'2',4,6,8,10]
print(2 in numbers)
print(9 not in numbers)
a = 10
b = 10
statement1 = (a==10)
statement2 = (b==10)
print(statement1 and statement2)
print(not(True))
print(not(False))
num = 10
print(num>5 and num<15)
print(num%2==0 or num%3==0)
print(not(num==0))
x = 10
y = 4
print(x&y)
print(x^y)
print(x|y)
a = "sorry"
print(a*100)
str1 = "hi hi hi"
str2 = " welcome to python"
print(str1+str2)
star = "*"*20
greating = "happy" + "journey"
print(star,greating,star,sep=("\n"))
'''
num = int(input())
name = str(input())
num2 = float(input())
num = int(input("enter the value:"))
print(num+10)
mark1 = int(input("enter the phy :"))
mark2 = int(input("enter the chem:"))
mark3 = int(input("enter the maths :"))
totalmark = mark1+mark2+mark3
avg_marks = totalmark/3
print(avg_marks)
a = int(input())
b  = int(input())
c = int(input())
formula = a**2+2*(b*c)+ c**2 
print(formula)
'''
num = int(input())
print(num[len(num)-1])

