import sys
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, QLabel, QWidget, QSizePolicy
from PyQt6.QtCore import Qt
# Define styles
MAIN_WINDOW_STYLE = """
    QMainWindow {
        background-color: white;
    }
"""

CONTAINER_STYLE = """
    QWidget {
        width: 100%;
        height: 100%;
    }
"""

LABEL_STYLE = """
    QLabel {
        color: black;
        font-size: 24px;
    }
"""

CONTAINER1_STYLE = """
    QWidget {
        background-color: red;
    }
"""
CONTAINER2_STYLE = """
    QWidget {
        background-color: green;
    }
"""
CONTAINER3_STYLE = """
    QWidget {
        background-color: blue;
    }
"""

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("My App")
        self.setMinimumSize(800, 600)

        # Create a QHBoxLayout for the three containers
        container_layout = QHBoxLayout()

        # Create the first container with its unique contents
        div_layout1 = QVBoxLayout()
        div1 = QLabel("Div 1")
        div1.setStyleSheet(LABEL_STYLE)
        div_layout1.addWidget(div1)
        container1 = QWidget()
        container1.setLayout(div_layout1)
        container1.setStyleSheet(CONTAINER1_STYLE)
        container_layout.addWidget(container1)

        # Create the second container with its unique contents
        div_layout2 = QVBoxLayout()
        div2 = QLabel("Div 2")
        div2.setStyleSheet(LABEL_STYLE)
        div_layout2.addWidget(div2)

        # Create a square with a black background
        square = QLabel()
        square.setStyleSheet("""
            QLabel {
                background-color: black;
                min-width: 50px;
                max-width: 50px;
                min-height: 50px;
                max-height: 50px;
            }
        """)
        div_layout2.addWidget(square)

        container2 = QWidget()
        container2.setLayout(div_layout2)
        container2.setStyleSheet(CONTAINER2_STYLE)
        container_layout.addWidget(container2)
        # Create the third container with its unique contents
        div_layout3 = QVBoxLayout()
        div3 = QLabel("Div 3")
        div3.setStyleSheet(LABEL_STYLE)
        div_layout3.addWidget(div3)
        container3 = QWidget()
        container3.setLayout(div_layout3)
        container3.setStyleSheet(CONTAINER3_STYLE)
        container_layout.addWidget(container3)

        container_layout.setStretch(0, 1)  # Left container takes up 1x space
        container_layout.setStretch(1, 2)  # Middle container takes up 2x space
        container_layout.setStretch(2, 1)  # Right container takes up 1x space

        # Create a QWidget, set its layout to the container_layout, and set it as the central widget
        central_widget = QWidget()
        central_widget.setLayout(container_layout)
        self.setCentralWidget(central_widget)

        self.setStyleSheet(MAIN_WINDOW_STYLE)

app = QApplication(sys.argv)

window = MainWindow()
window.showFullScreen()  # Make the window full screen

app.exec()