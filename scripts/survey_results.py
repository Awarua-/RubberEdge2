from math import log2
import config, os

def survey(data):
    processed = os.path.join(os.path.dirname(__file__), config.PROCESSED_DIR)

    survey_file = open(os.path.join(processed, "survey_results.txt"), 'w')

    for id, value in data.items():
        survey_file.write("Participant: {}\n".format(id))

        for survey_type, sequences in value.items():
            if survey_type in config.SURVEYS:
                if survey_type == 'presurvey':
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


    survey_file.close()
