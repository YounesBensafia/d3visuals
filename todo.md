# use numerical library
1. standardize the data
2. compute the covariance matrix
3. compute the eigenvectors and eigenvalues of the covariance matrix 
4. sort the eigenvectors by eigenvalues in descending order
5. select the top k eigenvectors, where k is the number of dimensions you want to reduce to (w'll reduce to 2 dimensions)
6. project the data into the new eigenvectors (to get the new data points, we need to multiply the original data points by the feature vector) each point give him a color based on the type

Ps: the second graph: we use feature vector as corr, where for example a1 a2 are the coordinates of the first cluster and b1 b2 are the coordinates of the second cluster
and so on for the other clusters, each represent the contribution of the original data points to the new clusters
all starting from the origin (0,0)