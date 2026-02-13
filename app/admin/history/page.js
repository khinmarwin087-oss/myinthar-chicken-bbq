"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 🔥 SAFE DATE FORMAT FUNCTION
  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    // Firestore Timestamp
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000)
        .toISOString()
        .split("T")[0];
    }

    // Already string
    return dateValue;
  };

  // 🔥 FETCH DATA (NO orderBy = NO INDEX ERROR)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const allOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const validOrders = allOrders.filter((o) =>
          ["Cooking", "Ready", "Done", "Success", "completed"].includes(
            o.status
          )
        );

        setOrders(validOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 🔥 FILTER + SORT
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const customerName = (
          o.name ||
          o.displayName ||
          o.customerName ||
          ""
        ).toLowerCase();

        const orderID = (o.orderId || o.id || "")
          .toString()
          .toLowerCase();

        const search = searchId.toLowerCase();

        const orderDate = formatDate(o.date);

        const matchesDate = selDate ? orderDate === selDate : true;

        const matchesSearch = searchId
          ? orderID.includes(search) ||
            customerName.includes(search)
          : true;

        return matchesDate && matchesSearch;
      })
      .sort((a, b) =>
        formatDate(b.date).localeCompare(formatDate(a.date))
      );
  }, [orders, selDate, searchId]);

  const totalIncome = filteredOrders.reduce(
    (acc, curr) =>
      acc + Number(curr.totalPrice || curr.total || 0),
    0
  );

  // 🔥 GROUP BY DATE
  const groupedOrders = useMemo(() => {
    return filteredOrders.reduce((groups, order) => {
      const date = formatDate(order.date) || "Unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
      return groups;
    }, {});
  }, [filteredOrders]);

  if (selectedOrder) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Receipt</h2>
        <p>
          Customer:{" "}
          {selectedOrder.name ||
            selectedOrder.displayName ||
            selectedOrder.customerName}
        </p>
        <p>
          Order ID: #
          {selectedOrder.orderId ||
            selectedOrder.id.slice(-6).toUpperCase()}
        </p>
        <p>
          Date: {formatDate(selectedOrder.date)}
        </p>
        <p>
          Total:{" "}
          {Number(
            selectedOrder.totalPrice ||
              selectedOrder.total ||
              0
          ).toLocaleString()}{" "}
          Ks
        </p>

        <button onClick={() => setSelectedOrder(null)}>
          BACK
        </button>
        <button onClick={() => window.print()}>
          PRINT
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Link href="/admin">Back</Link>

      <h2>Order History</h2>

      <input
        type="date"
        value={selDate}
        onChange={(e) => setSelDate(e.target.value)}
      />

      <input
        type="text"
        placeholder="Search Order ID or Name"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <strong>Total Revenue:</strong>{" "}
        {totalIncome.toLocaleString()} Ks
        <br />
        <strong>Total Orders:</strong>{" "}
        {filteredOrders.length}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(groupedOrders).length === 0 ? (
        <p>No orders found.</p>
      ) : (
        Object.keys(groupedOrders).map((date) => (
          <div key={date}>
            <h4>{date}</h4>
            {groupedOrders[date].map((order) => (
              <div
                key={order.id}
                style={{
                  border: "1px solid #ccc",
                  padding: 10,
                  marginBottom: 5,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSelectedOrder(order)
                }
              >
                <div>
                  {order.name ||
                    order.displayName ||
                    order.customerName}
                </div>
                <div>
                  #
                  {order.orderId ||
                    order.id.slice(-6).toUpperCase()}
                </div>
                <div>
                  {Number(
                    order.totalPrice ||
                      order.total ||
                      0
                  ).toLocaleString()}{" "}
                  Ks
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
