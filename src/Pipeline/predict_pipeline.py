import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image


class PredictPipeline:

    def __init__(self):

        self.model = load_model(
            "artifacts/drowsiness_model.h5"
        )

    def predict(self, image_path):

        img = image.load_img(
            image_path,
            target_size=(64, 64)
        )

        img_array = image.img_to_array(img)

        img_array = img_array / 255.0

        img_array = np.expand_dims(
            img_array,
            axis=0
        )

        prediction = self.model.predict(
            img_array,
            verbose=0
        )

        if prediction[0][0] > 0.5:
            return "sleepy"

        return "awake"


if __name__ == "__main__":

    predictor = PredictPipeline()

    result = predictor.predict(
        "test.jpg"
    )

    print("\nPrediction :", result)