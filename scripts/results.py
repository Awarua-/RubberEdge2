import json, os, config
from clutch_results import clutch
from timing_results import timing
def read_data(dir, file_name):
    path = os.path.join(dir, file_name)
    with open(path) as file:
        lines = file.readlines()
        for line in lines:
            data = json.loads(line)
            data['id'] = file_name.split('.')[0]
            yield data


class Experiment:

    def __init__(self):
        self.num_trainings = 3
        self.training_observered = 0
        self.ignore = False
        self.data = {'rubberedge': {}, 'constant': {}, 'acceleration': {}, 'presurvey': None, 'postsurvey': None, 'None': {}}
        self.levels = 9
        self.trials_per_level = 9
        self.switch_function = False
        self.functions = ['rubberedge', 'acceleration', 'constant', 'None']
        self.selected_function = self.functions[0]
        self.sequence_number = 0
        self.function_gen = self.get_function()
        self.count = 0
        self.things = 0

    def parse_data(self, data):
        switcher = {
            'presurvey': self.survey,
            'postsurvey': self.survey,
            # 'touchMove': touch,
            # 'touchEnd': touch,
            # 'touchStart': touch,
            'experiment': self.experiment

        }

        func = switcher.get(data['eventType'], lambda x: None)

        return func(data)

    def survey(self, data):
        key = data['eventType']
        self.data[key] = data

    def get_data(self):
        return self.data

    def get_count(self):
        return self.count

    def get_function(self):
        for i in range(1, len(self.functions)):
            yield self.functions[i]

    def experiment(self, data):
        if self.training_observered < self.num_trainings:
            # check to see if it is the start of a new one.
            if len(data.keys()) > 3:
                return
            self.training_observered += 1
            self.ignore = True
        else:
            # It is assumed that this is not training data
            # If data only has two keys
            if len(data.keys()) == 3:
                self.count += 1
                self.sequence_number += 1
                if self.sequence_number == self.levels:
                    # We are at the end of a sequence
                    # After 9 sequences and one extra, then change to next transferfunction
                    self.switch_function = True

            elif self.ignore:
                self.ignore = False
                return
            elif self.switch_function:
                # add the last experiment
                self.data[self.selected_function][(data['tr'] * 2, data['d'])].append(data)
                self.selected_function = next(self.function_gen)
                self.switch_function = False
                self.sequence_number = 0
                return
            else:
                key = (data['tr'] * 2, data['d'])
                if key not in self.data[self.selected_function]:
                    self.things += 1
                    self.data[self.selected_function][key] = []
                self.data[self.selected_function][key].append(data)
                #Now start logging



def main():
    output = {}
    dir = os.path.join(os.path.dirname(__file__), config.RESULTS_DIRECTORY)
    processed = os.path.join(os.path.dirname(__file__), config.PROCESSED_DIR)
    os.makedirs(processed, exist_ok=True)

    for file_name in os.listdir(dir):
        experiment = Experiment()
        generator = read_data(dir, file_name)
        id = file_name.split('.')[0]
        for _ in generator:
            experiment.parse_data(_)
        data = experiment.get_data()
        output[id] = data


    clutch(output)
    timing(output)

if __name__ == '__main__':
    main()
