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

const rawUrl = import.meta.env.VITE_API_URL as string;
const url = rawUrl.endsWith('/api/') ? rawUrl : rawUrl.endsWith('/api') ? rawUrl + '/' : rawUrl + '/api/';

const api = axios.create({
    baseURL: url,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;