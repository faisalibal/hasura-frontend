import React from "react";
import { ApolloProvider } from "@apollo/client";
import "rsuite/dist/rsuite.min.css";
import { client } from "./apollo-client/ApoloClient";
import ProductManagement from "./components/ProductManagement";

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <div style={{ padding: 20 }}>
        <h1>Product Management</h1>
        <ProductManagement />
      </div>
    </ApolloProvider>
  );
};

export default App;
