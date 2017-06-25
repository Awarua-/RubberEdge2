from math import log2
import config, os

likert_mapping = {'Strongly Agree': 5, 'Agree': 4, 'Netural': 3, 'Disagree': 2, 'Strongly Disagree': 1}

preference_mapping = {'yes': 1, 'no': 0, 'n/a': 2}

def survey(data):
    processed = os.path.join(os.path.dirname(__file__), config.PROCESSED_DIR)

    survey_file = open(os.path.join(processed, "survey_results.txt"), 'w')
    survey_accuracy = open(os.path.join(processed, "survey_accuracy.txt"), 'w')
    survey_ease = open(os.path.join(processed, "survey_ease.txt"), 'w')
    survey_frustration = open(os.path.join(processed, "survey_frustration.txt"), 'w')
    survey_preference = open(os.path.join(processed, "survey_preference.txt"), 'w')

    survey_accuracy.write("sub\tfunc\tlikert\n")
    survey_ease.write("sub\tfunc\tlikert\n")
    survey_frustration.write("sub\tfunc\tlikert\n")
    survey_preference.write("sub\tfunc\tacceleration\n")

    for id, value in data.items():
        survey_file.write("Participant: {}\n".format(id))

        for survey_type, sequences in value.items():
            if survey_type in config.SURVEYS:
                if survey_type == 'presurvey':
                    preference = sequences['accel']
                    survey_file.write("Gender: {}\tAge: {}\n".format(sequences['gender'], sequences['age']))
                    survey_file.write("Average time spent with trackpad per day: {}\tOperating system used with trackpad: {}\tDoes the Participant prefer acceleration when using a trackpad: {}\n\n".format(sequences['pointer'], sequences['os'], sequences['accel']))
                elif survey_type == 'postsurvey':
                    survey_file.write("Constant Function\n")
                    survey_file.write("It was frustrating: {}\tIt was easy to use: {}\tIt felt accurate: {}\n\n".format(sequences['constant frustration'], sequences['constant ease of use'], sequences['constant accuracy']))
                    survey_file.write("Acceleration Function\n")
                    survey_file.write("It was frustrating: {}\tIt was easy to use: {}\tIt felt accurate: {}\n\n".format(sequences['acceleration frustration'], sequences['acceleration ease of use'], sequences['acceleration accuracy']))
                    survey_file.write("RubberEdge Function\n")
                    survey_file.write("It was frustrating: {}\tIt was easy to use: {}\tIt felt accurate: {}\n\n".format(sequences['rubberedge frustration'], sequences['rubberedge ease of use'], sequences['rubberedge accuracy']))
                    survey_file.write("Overall preference: {}\n\n\n".format(sequences['preference']))

                    survey_accuracy.write("{}\tConstant\t{}\n".format(id, likert_mapping[sequences['constant accuracy']]))
                    survey_accuracy.write("{}\tAcceleration\t{}\n".format(id, likert_mapping[sequences['acceleration accuracy']]))
                    survey_accuracy.write("{}\tRubberEdge\t{}\n".format(id, likert_mapping[sequences['rubberedge accuracy']]))

                    survey_ease.write("{}\tConstant\t{}\n".format(id, likert_mapping[sequences['constant ease of use']]))
                    survey_ease.write("{}\tAcceleration\t{}\n".format(id, likert_mapping[sequences['acceleration ease of use']]))
                    survey_ease.write("{}\tRubberEdge\t{}\n".format(id, likert_mapping[sequences['rubberedge ease of use']]))

                    survey_frustration.write("{}\tConstant\t{}\n".format(id, likert_mapping[sequences['constant frustration']]))
                    survey_frustration.write("{}\tAcceleration\t{}\n".format(id, likert_mapping[sequences['acceleration frustration']]))
                    survey_frustration.write("{}\tRubberEdge\t{}\n".format(id, likert_mapping[sequences['rubberedge frustration']]))

                    survey_preference.write("{}\t{}\t{}\n".format(id, sequences['preference'], preference_mapping[preference]))


    survey_file.close()
    survey_accuracy.close()
    survey_ease.close()
    survey_frustration.close()
    survey_preference.close()
