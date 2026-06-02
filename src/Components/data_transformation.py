import sys
from dataclasses import dataclass

from tensorflow.keras.preprocessing.image import ImageDataGenerator

from src.exception import CustomException


@dataclass
class DataTransformationConfig:
    IMAGE_SIZE = (64, 64)
    BATCH_SIZE = 32

    TRAIN_PATH = "Dataset/data/train"
    VAL_PATH = "Dataset/data/val"
    TEST_PATH = "Dataset/data/test"


class DataTransformation:

    def __init__(self):
        self.config = DataTransformationConfig()

    def get_data_generators(self):

        try:

            train_datagen = ImageDataGenerator(
                rescale=1.0 / 255,
                rotation_range=20,
                zoom_range=0.2,
                horizontal_flip=True
            )

            test_datagen = ImageDataGenerator(
                rescale=1.0 / 255
            )

            train_generator = train_datagen.flow_from_directory(
                self.config.TRAIN_PATH,
                target_size=self.config.IMAGE_SIZE,
                batch_size=self.config.BATCH_SIZE,
                class_mode="binary"
            )

            val_generator = test_datagen.flow_from_directory(
                self.config.VAL_PATH,
                target_size=self.config.IMAGE_SIZE,
                batch_size=self.config.BATCH_SIZE,
                class_mode="binary"
            )

            test_generator = test_datagen.flow_from_directory(
                self.config.TEST_PATH,
                target_size=self.config.IMAGE_SIZE,
                batch_size=self.config.BATCH_SIZE,
                class_mode="binary",
                shuffle=False
            )

            return (
                train_generator,
                val_generator,
                test_generator
            )

        except Exception as e:
            raise CustomException(e, sys)


if __name__ == "__main__":

    obj = DataTransformation()

    train_gen, val_gen, test_gen = obj.get_data_generators()

    print("\nDataset Loaded Successfully\n")

    print("Train Samples      :", train_gen.samples)
    print("Validation Samples :", val_gen.samples)
    print("Test Samples       :", test_gen.samples)

    print("\nClass Mapping:")
    print(train_gen.class_indices)