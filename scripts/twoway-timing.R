list_of_packages <- c("ez", "plyr", "ggplot2", "lme4")
new_packages <- list_of_packages[!(list_of_packages %in%
    installed.packages()[, "Package"])]
if (length(new_packages)) install.packages(new_packages,
    repos = "https://cran.stat.auckland.ac.nz")

library(ez)
library(plyr)
library(ggplot2)
library(lme4)

sumfun <- function(x) {
    aux <- function(x) c(coef(x), summary(x)$r.squared)
    t(sapply(x, aux))
}

sink("../processed/anova-twoway-timing.txt", append = FALSE, split = FALSE)

data <- read.table("../processed/timing_multi.txt", header = TRUE)
data$sub <- factor(data$sub)
data$distance <- factor(data$distance, levels = c(500, 750, 1000),
labels = c("DS 79", "DM 118", "DL 157"))
data$int <- factor(data$int,
    levels = c("constant", "acceleration", "rubberedge"),
    labels = c("Constant", "Acceleration", "RubberEdge"))

times <- ddply(data, c("sub", "int", "distance"), summarise, mean = mean(time))

results <- ddply(data, c("int", "distance"), summarise, mean = mean(time),
sd = sd(time), se = sd / sqrt(length(time)), lower = mean - se,
upper = mean + se)

results

fitts <- ddply(data, c("int", "index"), summarise, mean = mean(time))
fit <-  lmList(mean ~ index | int, data = fitts)
sumfun(fit)

fitts_grouped <- ddply(data, c("int", "distance", "width", "index"), summarise,
mean = mean(time), sd = sd(time), se = sd / sqrt(length(time)))

fitts_grouped

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
    labs(fill = "Function", x = "Target Distance (mm)", y = "Mean Time (s)") +
    theme(panel.grid.major.x = element_blank(),
    panel.grid.major.y = element_line(colour = "grey"),
    panel.grid.minor = element_blank(),
    panel.background = element_blank(),
    axis.line = element_line(colour = "black")) +
    scale_y_continuous(expand = c(0, 0), minor_breaks = c(0.25, 0.75, 1.25))

last_plot()
ggsave("../processed/selection-time.png")

f <- ggplot(fitts_grouped, aes(x = index, y = mean, colour = int)) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    scale_fill_manual(values = cbb_palette) +
    labs(colour = "Function", x = "Index of Difficulty",
    y = "Mean Time (s)") +
    theme(panel.grid.major.x = element_blank(),
    panel.grid.major.y = element_line(colour = "grey"),
    panel.grid.minor = element_blank(),
    panel.background = element_blank(),
    axis.line = element_line(colour = "black")) +
    scale_y_continuous(limits = c(1, 4), expand = c(0, 0),
    minor_breaks = c(0.25, 0.75, 1.25)) +
    scale_x_continuous(limits = c(2, 6))

last_plot()
ggsave("../processed/fitts.png")

f <- ggplot(fitts_grouped, aes(x = index, y = mean, colour = int,
    shape = distance)) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    scale_fill_manual(values = cbb_palette) +
    labs(colour = "Function", shape = "Distance", x = "Index of Difficulty",
    y = "Mean Time (s)") +
    theme(panel.grid.major.x = element_blank(),
    panel.grid.major.y = element_line(colour = "grey"),
    panel.grid.minor = element_blank(),
    panel.background = element_blank(),
    axis.line = element_line(colour = "black")) +
    scale_y_continuous(limits = c(1, 4), expand = c(0, 0),
    minor_breaks = c(0.25, 0.75, 1.25)) +
    scale_x_continuous(limits = c(2, 6))

last_plot()
ggsave("../processed/fitts-grouped.png")
