# project 12
1. Read from data from the glass.csv which has columns (RI,Na,Mg,Al,Si,K,Ca,Ba,Fe,Type)
2. plot corelogram (corelation graph between all features)
3. standarize the data.
4. compute the covariance
5. we will eliminate the diagonale cause its represents the variance, and since the matrix/graph is symetrique so we show only one side to not have duplicates.
6. display features from ri to ba(left to right), and in the columns will display from fe to na (top to bottom).
7. we have 2 scales, the color which depends on correlation (we display the scale as divergente since correlation has values between -1 and 1), second scale is the size of circle which depends on the absolute values of correlation.