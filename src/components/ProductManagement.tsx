/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useSubscription, useMutation, gql } from "@apollo/client";
import { Table, Button, Modal, Form, DatePicker, Schema } from "rsuite";

const WATCH_PRODUCTS = gql`
  subscription WatchProducts {
    product {
      id
      product_name
      product_category
      product_prices {
        price
        valid_date
      }
    }
  }
`;

// GraphQL mutations
const ADD_PRODUCT = gql`
  mutation AddProduct($product: product_insert_input!) {
    insert_product_one(object: $product) {
      id
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: Int!, $changes: product_set_input!) {
    update_product_by_pk(pk_columns: { id: $id }, _set: $changes) {
      id
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: Int!) {
    delete_product_by_pk(id: $id) {
      id
    }
  }
`;

interface Product {
  id: number;
  product_name: string;
  product_category: string;
  product_prices: {
    price: number;
    valid_date: string;
  }[];
}

const { StringType, NumberType, DateType } = Schema.Types;

const model = Schema.Model({
  product_name: StringType().isRequired("This field is required."),
  product_category: StringType().isRequired("This field is required."),
  "product_prices.0.price": NumberType().isRequired("This field is required."),
  "product_prices.0.valid_date": DateType().isRequired(
    "This field is required."
  ),
});

const ProductManagement: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValue, setFormValue] = useState<any>({});

  const { data, loading, error } = useSubscription(WATCH_PRODUCTS);
  const [addProduct] = useMutation(ADD_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleAdd = () => {
    setEditingProduct(null);
    setFormValue({});
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormValue({
      ...product,
      "product_prices.0.price": product.product_prices[0]?.price,
      "product_prices.0.valid_date": new Date(
        product.product_prices[0]?.valid_date
      ),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct({ variables: { id } });
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!model.check(formValue)) {
      console.error("Form validation failed");
      return;
    }
    try {
      const productData = {
        product_name: formValue.product_name,
        product_category: formValue.product_category,
        product_prices: {
          data: [
            {
              price: formValue["product_prices.0.price"],
              valid_date:
                formValue["product_prices.0.valid_date"].toISOString(),
            },
          ],
        },
      };
      if (editingProduct) {
        await updateProduct({
          variables: {
            id: editingProduct.id,
            changes: productData,
          },
        });
      } else {
        await addProduct({
          variables: {
            product: productData,
          },
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <div>
      <Button
        onClick={handleAdd}
        appearance="primary"
        style={{ marginBottom: 10 }}
      >
        Add Product
      </Button>

      <Table
        height={400}
        width={1200}
        // style={{ width: "100%" }}
        data={data?.product}
        onRowClick={(data) => console.log(data)}
        className="w-[100vw]"
      >
        <Table.Column align="center" fixed width={300}>
          <Table.HeaderCell>Id</Table.HeaderCell>
          <Table.Cell dataKey="id" />
        </Table.Column>

        <Table.Column width={300}>
          <Table.HeaderCell>Product Name</Table.HeaderCell>
          <Table.Cell dataKey="product_name" />
        </Table.Column>

        <Table.Column width={300}>
          <Table.HeaderCell>Category</Table.HeaderCell>
          <Table.Cell dataKey="product_category" />
        </Table.Column>

        <Table.Column width={200}>
          <Table.HeaderCell>Latest Price</Table.HeaderCell>
          <Table.Cell>
            {(rowData: any) => {
              if (rowData?.product_prices?.length > 0) {
                const latestPrice = rowData.product_prices.reduce(
                  (latest: any, current: any) =>
                    new Date(current.valid_date) > new Date(latest.valid_date)
                      ? current
                      : latest,
                  rowData.product_prices[0] // Use the first element as the initial value
                );
                return `$${latestPrice.price} (from ${new Date(
                  latestPrice.valid_date
                ).toLocaleDateString()})`;
              } else {
                return "No price available";
              }
            }}
          </Table.Cell>
        </Table.Column>

        <Table.Column width={120} fixed="right">
          <Table.HeaderCell>Action</Table.HeaderCell>
          <Table.Cell>
            {(rowData: any) => (
              <span>
                <a onClick={() => handleEdit(rowData as Product)}> Edit </a> |
                <a onClick={() => handleDelete(rowData.id)}> Delete </a>
              </span>
            )}
          </Table.Cell>
        </Table.Column>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>
          <Modal.Title>
            {editingProduct ? "Edit Product" : "Add Product"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            fluid
            model={model}
            formValue={formValue}
            onChange={setFormValue}
            onSubmit={handleSubmit}
          >
            <Form.Group>
              <Form.ControlLabel>Product Name</Form.ControlLabel>
              <Form.Control name="product_name" />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Category</Form.ControlLabel>
              <Form.Control name="product_category" />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Price</Form.ControlLabel>
              <Form.Control name="product_prices.0.price" type="number" />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Valid Date</Form.ControlLabel>
              <Form.Control
                name="product_prices.0.valid_date"
                accepter={DatePicker}
              />
            </Form.Group>
            <Button appearance="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductManagement;
