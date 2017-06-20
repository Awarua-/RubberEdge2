from math import log2, log1p
import config, os

def timing(data):
    processed = os.path.join(os.path.dirname(__file__), config.PROCESSED_DIR)

    multi_anova = open(os.path.join(processed, 'timing_multi.txt'), 'w')
    multi_anova.write('sub\tint\tindex\ttime\twidth\tdistance\n')
    for id, value in data.items():
        for function, sequences in value.items():
            if function in config.FUNCTIONS:
                for difficulty, trials in sequences.items():
                    ## loop over trials
                    index = "{0:.2f}".format(log2(2 * difficulty[1] / difficulty[0]))
                    last_hit = None
                    for _ in trials:
                        if _['miss'] == False:
                            if last_hit != None:
                                time = (_['t'] - last_hit['t']) / 1000
                                # remove outliners in data, if over 20 seconds
                                # removes one point that was 200 seconds???
                                if time > 20:
                                    continue

                                multi_anova.write(id+ '\t' + function + '\t' + index + '\t' + str(time) + '\t' + str(difficulty[0]) + '\t' + str(difficulty[1]) + '\n')
                            last_hit = _

    multi_anova.close()
