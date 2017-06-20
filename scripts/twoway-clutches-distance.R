list_of_packages <- c("ez", "plyr", "ggplot2")
new_packages <- list_of_packages[!(list_of_packages %in%
    installed.packages()[, "Package"])]
if (length(new_packages)) install.packages(new_packages,
    repos = "https://cran.stat.auckland.ac.nz")

library(ez)
library(plyr)
library(ggplot2)

sink("../processed/anova-twoway-clutches.txt", append = FALSE, split = FALSE)

data <- read.table("../processed/clutches_multi.txt", header = TRUE)
data$sub <- factor(data$sub)
data$distance <- factor(data$distance, levels = c(500, 750, 1000),
    labels = c("DS 79", "DM 118", "DL 157"))
data$int <- factor(data$int,
    levels = c("constant", "acceleration", "rubberedge"),
    labels = c("Constant", "Acceleration", "RubberEdge"))

times <- ddply(data, c("sub", "int", "distance"), summarise,
    mean = mean(clutches))

results <- ddply(data, c("int", "distance"), summarise, mean = mean(clutches),
    sd = sd(clutches), se = sd / sqrt(length(clutches)), lower = mean - se,
    upper = mean + se)

results

ezANOVA(data = times, dv = mean, within = .(int, distance), wid = sub)
pairwise.t.test(times$mean, times$int, p.adj = "bonf", paired = T)
pairwise.t.test(times$mean, times$distance, p.adj = "bonf", paired = T)

dodge <- position_dodge(width = 0.9)
cbb_palette <- c("#0072B2", "#CC79A7", "#F0E442")

g <- ggplot(results, aes(x = distance, y = mean, fill = int)) +
    geom_bar(position = dodge, stat = "identity") +
    scale_fill_manual(values = cbb_palette) +
    geom_errorbar(aes(ymin = lower, ymax = upper), position = dodge,
    width = 0.25) +
    labs(fill = "Function", x = "Target Distance (mm)", y = "Mean Clutches #") +
    theme(panel.grid.major.x = element_blank(),
    panel.grid.major.y = element_line(colour = "grey"),
    panel.grid.minor = element_blank(),
    panel.background = element_blank(),
    axis.line = element_line(colour = "black")) +
    scale_y_continuous(expand = c(0, 0))

last_plot()
ggsave("../processed/clutches.png")
