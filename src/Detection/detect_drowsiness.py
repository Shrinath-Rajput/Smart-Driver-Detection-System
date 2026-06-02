import cv2
import numpy as np
import threading
import winsound

from tensorflow.keras.models import load_model

# Load Model
model = load_model("artifacts/drowsiness_model.h5")

# Face Detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

# Eye Detector
eye_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_eye.xml"
)

sleep_counter = 0
ALARM_THRESHOLD = 15
alarm_running = False


def play_alarm():
    global alarm_running

    alarm_running = True

    try:
        winsound.Beep(2500, 1000)
    except:
        pass

    alarm_running = False


cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Camera not found")
    exit()

while True:

    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2GRAY
    )

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5
    )

    status = "AWAKE"

    for (x, y, w, h) in faces:

        cv2.rectangle(
            frame,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

        roi_color = frame[y:y+h, x:x+w]

        eyes = eye_cascade.detectMultiScale(
            roi_color
        )

        if len(eyes) > 0:

            ex, ey, ew, eh = eyes[0]

            eye = roi_color[
                ey:ey+eh,
                ex:ex+ew
            ]

            eye = cv2.resize(
                eye,
                (64, 64)
            )

            eye = eye.astype("float32") / 255.0

            eye = np.expand_dims(
                eye,
                axis=0
            )

            prediction = model.predict(
                eye,
                verbose=0
            )

            confidence = prediction[0][0]

            if confidence > 0.5:

                status = "SLEEPY"
                sleep_counter += 1

            else:

                status = "AWAKE"
                sleep_counter = 0

    if sleep_counter > ALARM_THRESHOLD:

        cv2.putText(
            frame,
            "DROWSINESS ALERT!",
            (40, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            3
        )

        if not alarm_running:

            threading.Thread(
                target=play_alarm,
                daemon=True
            ).start()

    cv2.putText(
        frame,
        f"Status : {status}",
        (40, 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 0, 0),
        2
    )

    cv2.putText(
        frame,
        f"Sleep Counter : {sleep_counter}",
        (40, 140),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 0),
        2
    )

    cv2.imshow(
        "Smart Driver Detection System",
        frame
    )

    key = cv2.waitKey(1)

    if key == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()