import os
import sys

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Flatten,
    Dense,
    Dropout
)

from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint
)

from src.exception import CustomException
from src.logger import logging
from src.Components.data_transformation import DataTransformation


class ModelTrainer:

    def __init__(self):

        self.model_path = "artifacts/drowsiness_model.h5"

    def initiate_model_trainer(self):

        try:

            logging.info("Loading Dataset")

            data_obj = DataTransformation()

            train_gen, val_gen, test_gen = (
                data_obj.get_data_generators()
            )

            logging.info("Building CNN Model")

            model = Sequential([

                Conv2D(
                    32,
                    (3, 3),
                    activation="relu",
                    input_shape=(64, 64, 3)
                ),

                MaxPooling2D(2, 2),

                Conv2D(
                    64,
                    (3, 3),
                    activation="relu"
                ),

                MaxPooling2D(2, 2),

                Conv2D(
                    128,
                    (3, 3),
                    activation="relu"
                ),

                MaxPooling2D(2, 2),

                Flatten(),

                Dense(
                    128,
                    activation="relu"
                ),

                Dropout(0.5),

                Dense(
                    1,
                    activation="sigmoid"
                )
            ])

            model.compile(
                optimizer="adam",
                loss="binary_crossentropy",
                metrics=["accuracy"]
            )

            os.makedirs("artifacts", exist_ok=True)

            callbacks = [

                EarlyStopping(
                    monitor="val_loss",
                    patience=3,
                    restore_best_weights=True
                ),

                ModelCheckpoint(
                    self.model_path,
                    monitor="val_accuracy",
                    save_best_only=True,
                    verbose=1
                )
            ]

            logging.info("Training Started")

            model.fit(
                train_gen,
                validation_data=val_gen,
                epochs=10,
                callbacks=callbacks
            )

            logging.info("Evaluating Model")

            loss, accuracy = model.evaluate(test_gen)

            print("\n" + "=" * 50)
            print(f"Test Accuracy : {accuracy * 100:.2f}%")
            print("=" * 50)

            model.save(self.model_path)

            logging.info("Model Saved Successfully")

            print("\nModel Saved At:")
            print(self.model_path)

            return accuracy

        except Exception as e:
            raise CustomException(e, sys)


if __name__ == "__main__":

    trainer = ModelTrainer()

    trainer.initiate_model_trainer()