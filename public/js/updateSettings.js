/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
      : 'http://127.0.0.1:3000/api/v1/users/updateMe';
  try {
    const updatedUser = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (updatedUser.data.status === 'success') {
      showAlert('success', `${type.toUpperCase} updated successfuly!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
