<aside>
👋 Welcome to ISOAI! Our mission is to develop cutting-edge technology solutions, focusing on face recognition, speech recognition, speaker diarization, and facial emotion detection using Python. We proudly serve the Istanbul Chamber of Industry by innovating and optimizing their technological needs.

Questions? Here’s how to reach us:

- Email: isoaiteam@gmail.com
- Team: [@ISOAI](https://github.com/isoai/)
</aside>

## About the Team

[@Fatih Yavuz](https://github.com/yvzfth/)

[@Gorkem Karamolla](https://github.com/gorkemkaramolla/)

### Install CUDA 11.8

[NVIDIA - CUDA | onnxruntime](https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html)

## **Requirements**

Please reference the table below for official GPU packages dependencies for the ONNX Runtime inferencing package. Note that ONNX Runtime Training is aligned with PyTorch CUDA versions; refer to the Training tab on [onnxruntime.ai](https://onnxruntime.ai/) for supported versions.

### Install CUDA Toolkit 11.8

#### For Windows

1. Download the installer from the [CUDA Toolkit 11.8 Downloads | NVIDIA Developer](https://developer.nvidia.com/cuda-11-8-0-download-archive?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exe_local).
2. Double click `cuda_11.8.0_522.06_windows.exe`.
3. Follow the on-screen prompts to complete the installation.

To verify the installation:

1. Open the command prompt.
2. Type the following command and press Enter:

    ```bash
    nvcc --version
    ```

This command should output information about the NVIDIA CUDA Compiler (nvcc), including the version of the CUDA toolkit that is installed.

If you get an error saying that 'nvcc' is not recognized as an internal or external command, it means either CUDA is not installed or it's not added to the system PATH. If CUDA is installed but not added to the system PATH, you need to add it. The CUDA bin directory (which contains `nvcc`) is typically located at `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin`.

#### For Linux

1. Download the installer from the [CUDA Toolkit 11.8 Downloads | NVIDIA Developer](https://developer.nvidia.com/cuda-11-8-0-download-archive?target_os=Linux&target_arch=x86_64&target_distro=Ubuntu&target_version=18.04&target_type=deb_local).
2. Open a terminal and navigate to the directory where the installer is downloaded.
3. Install the toolkit by running the following commands:

    ```bash
    sudo dpkg -i cuda-repo-<distro>_<version>_amd64.deb
    sudo apt-key adv --fetch-keys http://developer.download.nvidia.com/compute/cuda/repos/<distro>/x86_64/7fa2af80.pub
    sudo apt-get update
    sudo apt-get install cuda
    ```

To verify the installation:

1. Open a terminal.
2. Type the following command and press Enter:

    ```bash
    nvcc --version
    ```

This command should output information about the NVIDIA CUDA Compiler (nvcc), including the version of the CUDA toolkit that is installed.

If you get an error saying that 'nvcc' is not recognized as an internal or external command, it means either CUDA is not installed or it's not added to the system PATH. If CUDA is installed but not added to the system PATH, you need to add it by appending the following lines to your `.bashrc` file:

```bash
export PATH=/usr/local/cuda-11.8/bin${PATH:+:${PATH}}
export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
```

Then, reload your `.bashrc` file:

```bash
source ~/.bashrc
```

### Install cuDNN 8.5.0.96

#### For Windows

1. Download the cuDNN installer from the [Index of /compute/redist/cudnn/v8.5.0/local_installers/11.7 (nvidia.com)](https://developer.download.nvidia.com/compute/redist/cudnn/v8.5.0/local_installers/11.7/).

2. Specifically, download the archive: [cudnn-windows-x86_64-8.5.0.96_cuda11-archive.zip](https://developer.download.nvidia.com/compute/redist/cudnn/v8.5.0/local_installers/11.7/cudnn-windows-x86_64-8.5.0.96_cuda11-archive.zip).

3. Extract the contents to `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8`.

#### Install zlib123dllx64

1. Download zlib from the provided link: [zlib123dllx64.zip](https://drive.google.com/file/d/1lB26uw7wbu3DjWuDGMgRrZPy1nGnjXvJ/view?usp=drive_link).

2. Extract the contents to `C:\Program Files\zlib123dllx64`.

3. Add the following path to your system environment variables:

    `C:\Program Files\zlib123dllx64\dll_x64`

#### For Linux

1. Download the cuDNN installer from the [Index of /compute/redist/cudnn/v8.5.0/local_installers/11.7 (nvidia.com)](https://developer.download.nvidia.com/compute/redist/cudnn/v8.5.0/local_installers/11.7/).

2. Extract the downloaded archive:

    ```bash
    tar -xzvf cudnn-linux-x86_64-8.5.0.96_cuda11-archive.tar.xz
    ```

3. Copy the extracted files to your CUDA directory:

    ```bash
    sudo cp cuda/include/cudnn*.h /usr/local/cuda/include
    sudo cp cuda/lib64/libcudnn* /usr/local/cuda/lib64
    sudo chmod a+r /usr/local/cuda/include/cudnn*.h /usr/local/cuda/lib64/libcudnn*
    ```

4. Verify the installation:

    ```bash
    cat /usr/local/cuda/include/cudnn_version.h | grep CUDNN_MAJOR -A 2
    ```

#### Install zlib

1. Install zlib using your package manager:

    ```bash
    sudo apt-get update
    sudo apt-get install zlib1g zlib1g-dev
    ```

Ensure zlib is correctly installed and available in your system paths.

## Manual Installation for Insightface Buffalo_L Model

[Download the model](https://drive.google.com/file/d/1wPUyYprKHPUTzTxuLMuIF3YiCuHt3s5z/view?usp=drive_link)

### Installing CUDA Container Toolkit with Apt

1. Configure the production repository:

    ```bash
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
      && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
        sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
        sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    ```

2. Optionally, configure the repository to use experimental packages:

    ```bash
    sed -i -e '/experimental/ s/^#//g' /etc/apt/sources.list.d/nvidia-container-toolkit.list
    ```

3. Update the packages list from the repository:

    ```bash
    sudo apt-get update
    ```

4. Install the NVIDIA Container Toolkit packages:

    ```bash
    sudo apt-get install -y nvidia-container-toolkit
    ```

For further information, check the installation guide from the NVIDIA website: [NVIDIA Container Toolkit Installation Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

### Configuring Docker

1. Configure the container runtime by using the `nvidia-ctk` command:

    ```bash
    sudo nvidia-ctk runtime configure --runtime=docker
    ```

    The `nvidia-ctk` command modifies the `/etc/docker/daemon.json` file on the host. The file is updated so that Docker can use the NVIDIA Container Runtime.

2. Restart the Docker daemon:

    ```bash
    sudo systemctl restart docker
    ```

## Quick Start

```bash
git clone https://github.com/gorkemkaramolla/iso-fr-ai.git
cd iso-fr-ai
docker compose up --build 
```

### Run Frontend Code

#### Open another terminal

```bash
cd iso-fr-ai
cd iso-electron && npm run isoai
```
