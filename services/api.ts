// // A simple fetch wrapper for handling API requests, token, and error parsing.
// // In a real app, you would replace this with a more robust solution.

// const api = {
//   async get(url: string) {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         // Authorization: `Bearer ${your_auth_token}`
//       },
//     });
//     if (!response.ok) {
//       throw new Error('Network response was not ok.');
//     }
//     return response.json();
//   },

//   async post(url: string, data: any) {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Authorization: `Bearer ${your_auth_token}`
//       },
//       body: JSON.stringify(data),
//     });
//     if (!response.ok) {
//       throw new Error('Network response was not ok.');
//     }
//     return response.json();
//   },
// };

// export default api;
