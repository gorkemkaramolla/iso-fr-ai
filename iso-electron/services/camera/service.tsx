export const getRecogFaces = async (date?: string) => {
  try {
    let url = `${process.env.NEXT_PUBLIC_FLASK_URL}/recog`;
    if (date) {
      url += `?date=${date}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recognized faces', error);
    throw error;
  }
};
export const updateRecogName = async (id: string, newName: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FLASK_URL}/recog/name/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating name', error);
    alert('Error updating name: ' + error);
    return false;
  }
};
