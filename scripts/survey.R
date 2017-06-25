sink("../processed/survey_output.txt", append = FALSE, split = FALSE)

frustration <- read.table("../processed/survey_frustration.txt", header = TRUE)
ease <- read.table("../processed/survey_ease.txt", header = TRUE)
accuracy <- read.table("../processed/survey_accuracy.txt", header = TRUE)
preference <- read.table("../processed/survey_preference.txt", header = TRUE)

"Frustration"
frustration
friedman.test(likert ~ func | sub, frustration)
"Ease of Use"
ease
friedman.test(likert ~ func | sub, ease)
"Accuracy"
accuracy
friedman.test(likert ~ func | sub, accuracy)

preference
