import os
from dataclasses import dataclass


@dataclass
class DataIngestionConfig:
    train_dir = "Dataset/data/train"
    val_dir = "Dataset/data/val"
    test_dir = "Dataset/data/test"


class DataIngestion:

    def __init__(self):
        self.config = DataIngestionConfig()

    def initiate_data_ingestion(self):

        print("\nChecking Dataset Structure...\n")

        folders = [
            self.config.train_dir,
            self.config.val_dir,
            self.config.test_dir
        ]

        for folder in folders:

            if not os.path.exists(folder):
                raise Exception(f"{folder} not found")

            print(f"✓ Found: {folder}")

        print("\nDataset Ready Successfully\n")

        return (
            self.config.train_dir,
            self.config.val_dir,
            self.config.test_dir
        )


if __name__ == "__main__":

    obj = DataIngestion()

    train_dir, val_dir, test_dir = obj.initiate_data_ingestion()

    print("Train Path      :", train_dir)
    print("Validation Path :", val_dir)
    print("Test Path       :", test_dir)