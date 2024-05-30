import os
import pandas as pd

CAMERA_URLS_FILE = 'camera_urls.csv'

def read_camera_urls():
    if not os.path.exists(CAMERA_URLS_FILE):
        return {}
    
    df = pd.read_csv(CAMERA_URLS_FILE, index_col=0)
    return df.to_dict()['url']

def write_camera_urls(camera_urls):
    df = pd.DataFrame(list(camera_urls.items()), columns=['label', 'url'])
    df.to_csv(CAMERA_URLS_FILE, index=False)