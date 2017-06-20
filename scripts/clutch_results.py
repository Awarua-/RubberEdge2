from math import log2
import config, os

def clutch(data):
    processed = os.path.join(os.path.dirname(__file__), config.PROCESSED_DIR)

    one_anova = open(os.path.join(processed, "clutches.txt"), 'w')
    multi_anova = open(os.path.join(processed, 'clutches_multi.txt'), 'w')
    one_anova.write('sub\tint\tclutches\twidth\tdistance\n')
    multi_anova.write('sub\tint\tindex\tclutches\twidth\tdistance\n')
    for id, value in data.items():
        for function, sequences in value.items():
            if function in config.FUNCTIONS:
                for difficulty, trials in sequences.items():
                    ## loop over trials count the clutches
                    index = "{0:.2f}".format(log2(2 * difficulty[1] / difficulty[0]))
                    misses = 0
                    for _ in trials:
                        if _['miss']:
                            misses += 1
                        else:
                            misses += 1
                            #log number of clutches
                            one_anova.write(id+ '\t' + function + '\t' + str(misses) + '\t' + str(difficulty[0]) + '\t' + str(difficulty[1]) + '\n')
                            multi_anova.write(id+ '\t' + function + '\t' + index + '\t' + str(misses) + '\t' + str(difficulty[0]) + '\t' + str(difficulty[1]) + '\n')
                            misses = 0


    one_anova.close()
    multi_anova.close()
