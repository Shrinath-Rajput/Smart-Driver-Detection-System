from src.Components.model_trainer import ModelTrainer


def start_training():

    trainer = ModelTrainer()

    accuracy = trainer.initiate_model_trainer()

    print(f"\nTraining Completed")
    print(f"Accuracy: {accuracy * 100:.2f}%")


if __name__ == "__main__":
    start_training()