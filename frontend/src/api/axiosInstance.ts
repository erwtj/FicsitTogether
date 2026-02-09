import axios from "axios";

//* Axios Example *//
//
// const { getAccessTokenSilently } = useAuth0();
// const token = await getAccessTokenSilently();
//
// const response = await api.get("/hello-world", {
//     headers: {
//         Authorization: `Bearer ${token}`
//     }
// });
//
// console.log(response.data);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api/',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;