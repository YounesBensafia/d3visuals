csv type tali fel csv des num, les donnee ne sont pas normalise, consider that 

we have kaml attributes

follow the steps to of pca
step1: standardize the data
(x1,x2,x3,4)=>(x1 prime, x2 prime, x3 prime, x4 prime)

step2: compute the covariance matrix

diagonal elements are the variances of the variables
off-diagonal elements are the covariances between the variables


step3: compute the eigenvectors and eigenvalues of the covariance matrix

in javascript, we can use the eigen function from the mathjs library

we would get 4 eigenvectors and 4 eigenvalues


step4: sort the eigenvectors by eigenvalues in descending order

bel lib yekhorjou deja sorted

bach nel9aw labda el max

step5: select the top k eigenvectors, where k is the number of dimensions you want to reduce to (w'll reduce to 2 dimensions)


feature vector:

a1 a2
b1 b2
c1 c2
d1 d2

step6: project the data onto the new eigenvectors


to get the new data points, we need to multiply the original data points by the feature vector



then we create like a fake cluster plot

we use feature vector as corr, where for example a1 a2 are the coordinates of the first cluster and b1 b2 are the coordinates of the second cluster
and so on for the other clusters, each represent the contribution of the original data points to the new clusters
all starting from the origin (0,0)

categorize them with color each type in the csv file would be a different color


numeric.min.js