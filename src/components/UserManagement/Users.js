import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { DataGrid } from "@mui/x-data-grid";
import { Box} from "@mui/material";

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map((doc, index) => ({
          id: doc.id,
          no: index + 1,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      }
    };

    fetchUsers();
  }, []);

  const columns = [
    { field: "no", headerName: "STT", width: 70 },
    { field: "name", headerName: "Tên", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "date", headerName: "Ngày đăng nhập", flex: 1},
  ];

  return (
    <Box sx={{ height: 500, width: "100%", p: 2 }}>
      <DataGrid
        rows={users}
        columns={columns}
        pageSize={8}
        rowsPerPageOptions={[8, 20, 50]}
        disableSelectionOnClick
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: 2,
        }}
      />
    </Box>
  );
};

export default Users;
