import Contact from 'Frontend/generated/com/example/application/Contact';
import { ContactEndpoint } from 'Frontend/generated/endpoints';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  Input,
  InputDomRef,
  Label,
  RadioButton,
  Table,
  TableCell,
  TableCellDomRef,
  TableColumn,
  TableGrowingMode,
  TableRow,
} from '@ui5/webcomponents-react';

type Props = {
  opened: boolean;
  onAssignContact: (contact: Contact | undefined) => void;
};

// Show Grid in the dialog to choose a contact.
// DataProvider is used for paging the Grid with virtual scrolling from ContactEndpoint
export function ContactDialog({ opened, onAssignContact }: Props): JSX.Element {
  const [assigned, setAssigned] = useState<Contact>();
  const [filter, setFilter] = useState('');
  const cellRef = useRef<TableCellDomRef>(null);

  function assignTodo(value: Contact | undefined) {
    onAssignContact(value);
  }

  function updateFilter(filter: string | undefined) {
    if (filter) {
      setFilter(filter);
    }
  }

  const createContacts = (contacts: Contact[]) => {
    console.log('Creating ' + contacts.length + ' rows');
    return contacts.map((contact) => (
      <TableRow selected={assigned ? contact.id == assigned.id : false} key={`row-${contact.id}`}>
        <TableCell ref={assigned ? (contact.id == assigned.id ? cellRef : null) : null}>
          <RadioButton
            checked={assigned ? contact.id == assigned.id : false}
            onChange={(event) => setAssigned(contact)}
          ></RadioButton>
        </TableCell>
        <TableCell>
          <Label>{contact.firstName.toUpperCase() + ' ' + contact.lastName}</Label>
        </TableCell>
        <TableCell>
          <Label>{contact.email}</Label>
        </TableCell>
      </TableRow>
    ));
  };

  function ContactTable() {
    const [rows, setRows] = useState<JSX.Element[]>([]);
    var page = 0;
    const onLoadMore = useCallback(async () => {
      page++;
      const newContacts = (await ContactEndpoint.getPage(page, 25, filter)).content;
      setRows((prev) => [...prev, ...createContacts(newContacts)]);
      setTimeout(() => cellRef.current?.scrollIntoView(), 100);
    }, [filter]);
    useEffect(() => {
      (async () => {
        const firstContacts = (await ContactEndpoint.getPage(0, 25, filter)).content;
        setRows((prev) => [...prev, ...createContacts(firstContacts)]);
        setTimeout(() => cellRef.current?.scrollIntoView(), 100);
      })();
      return () => {};
    }, []);
    return (
      <div style={{ width: '700px', height: '400px' }}>
        <Table
          onLoadMore={onLoadMore}
          growing={TableGrowingMode.Scroll}
          columns={
            <>
              <TableColumn></TableColumn>
              <TableColumn>
                <Label>Name</Label>
              </TableColumn>
              <TableColumn>
                <Label>Email</Label>
              </TableColumn>
            </>
          }
        >
          {rows}
        </Table>
      </div>
    );
  }

  return (
    <>
      <Dialog
        children={<ContactTable></ContactTable>}
        style={{ zIndex: '2000' }}
        open={opened}
        header={<h3 className="m-0">Assign Todo</h3>}
        onAfterOpen={() => setFilter('')}
        state="Information"
        footer={
          <div className="flex gap-m w-full">
            <Input
              className="mr-auto"
              placeholder="Filter"
              value={filter}
              onChange={(event) => updateFilter((event.currentTarget as InputDomRef).value)}
            ></Input>
            <Button design="Default" onClick={() => assignTodo(undefined)}>
              Cancel
            </Button>
            <Button design="Emphasized" disabled={assigned ? false : true} onClick={() => assignTodo(assigned)}>
              Assign
            </Button>
          </div>
        }
      />
    </>
  );
}
