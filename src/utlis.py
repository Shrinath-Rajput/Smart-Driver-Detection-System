import os
import pickle


def save_object(file_path, obj):

    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as file_obj:
        pickle.dump(obj, file_obj)


def load_object(file_path):

    with open(file_path, "rb") as file_obj:
        return pickle.load(file_obj)