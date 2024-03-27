# **ISO Facial Recognition AI**

The ISO Facial Recognition AI (iso-fr-ai) is an advanced facial recognition project that utilizes **`insightface`** for facial recognition capabilities. This README outlines the steps to set up the environment and run the project both locally and using an Electron front end.

## **Prerequisites**

Before you begin, ensure you have Git, Python, and Node.js installed on your machine. These are necessary to clone the repository, create a Python virtual environment, install dependencies, and run the Electron application.

## **Setup**

Clone the repository to your local machine:

```
git clone https://github.com/gorkemkaramolla/iso-fr-ai.git
```

Navigate into the cloned directory:

```
cd iso-fr-ai
```

Create a Python virtual environment in the directory:

```
python -m venv .
```

### **Activation**

### macOS/Linux

Activate the virtual environment:

```
source bin/activate
```

### Windows

On Windows, use:

```
.\Scripts\Activate
```

### **Dependencies**

Install the required Python dependencies:

```
pip install -r requirements.txt
```

## **Running the Local Version**

To run the facial recognition locally using **`insightface`**:

1. Navigate to the **`insightface`** directory:

```
cd insightface
```

3. Execute the main script:

```
python main.py
```

## **Running the Electron Version**

To run the facial recognition with an Electron front end:

1. Open a separate terminal and navigate to the **`insightface`** directory:

```
cd iso-fr-ai/insightface
```

2. Start the stream server:

```
python stream.py
```

3. Open another terminal, navigate to the **`iso-electron`** directory:

```
cd iso-fr-ai/iso-electron
```

4. Install the Electron & NextJS dependencies:

```
npm install
```

5. Run the Electron application:

```
npm run dev
```

