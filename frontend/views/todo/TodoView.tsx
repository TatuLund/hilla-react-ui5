import type Todo from 'Frontend/generated/com/example/application/Todo';
import { useEffect, useState } from 'react';
import { FormikErrors, useFormik } from 'formik';
import {
  ComboBox,
  Input,
  Button,
  Card,
  CardHeader,
  CheckBoxDomRef,
  StepInput,
  ComboBoxItem,
  CheckBox,
  Form,
  FormItem,
  DatePicker,
} from '@ui5/webcomponents-react';
import { TodoEndpoint } from 'Frontend/generated/endpoints';
import { EndpointValidationError } from '@hilla/frontend';
import { Tooltip } from '@hilla/react-components/Tooltip.js';
import { TextField } from '@hilla/react-components/TextField.js';
import { ContactDialog } from './ContactDialog';
import Contact from 'Frontend/generated/com/example/application/Contact';
import { createPortal } from 'react-dom';

export default function TodoView(): JSX.Element {
  const empty: Todo = { task: '', done: false };
  const [assigned, setAssigned] = useState<Contact>();
  const [dialogOpened, setDialogOpened] = useState(false);
  const [todos, setTodos] = useState(Array<Todo>());
  const presets = ['Make food', 'Clean the house', 'Do the groceries', 'Mow the lawn', 'Walk the dog'];

  const formik = useFormik({
    initialValues: empty,
    onSubmit: async (value: Todo, { setSubmitting, setErrors }) => {
      try {
        const saved = (await TodoEndpoint.save(value)) ?? value;
        setTodos([...todos, saved]);
        formik.resetForm();
      } catch (e: unknown) {
        if (e instanceof EndpointValidationError) {
          const errors: FormikErrors<Todo> = {};
          console.log(e.validationErrorData);
          for (const error of e.validationErrorData) {
            if (typeof error.parameterName === 'string' && error.parameterName) {
              const key = error.parameterName as string & keyof Todo;
              errors[key] = error.message.substring(error.message.indexOf('validation error:'));
            }
          }
          setErrors(errors);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    (async () => {
      setTodos(await TodoEndpoint.findAll());
    })();

    return () => {};
  }, []);

  async function changeStatus(todo: Todo, done: boolean | undefined): Promise<void> {
    const isDone = done ? done : false;
    const newTodo = { ...todo, done: isDone };
    const saved = (await TodoEndpoint.save(newTodo)) ?? newTodo;
    setTodos(todos.map((item) => (item.id === todo.id ? saved : item)));
  }

  function noDone(): boolean {
    return todos.filter((todo) => todo.done).length == 0;
  }

  async function remove(): Promise<void> {
    const dones = todos.filter((todo) => todo.done);
    await TodoEndpoint.remove(dones);
    const notDone = todos.filter((todo) => !todo.done);
    setTodos(notDone);
  }

  function assignTodo(value: Contact | undefined) {
    if (value) {
      formik.values.assigned = value;
      setAssigned(value);
      setDialogOpened(false);
    } else {
      setDialogOpened(false);
    }
  }

  return (
    <>
      <div className="shadow-s m-m p-s">
        <Form columnsS="2" columnsM="2" columnsL="2as" columnsXL="2" titleText="New Todo">
          <FormItem label="Task">
            <ComboBox
              placeholder="Task"
              id="task"
              value={formik.values.task}
              onChange={formik.handleChange}
              onInput={formik.handleChange}
              onSelectionChange={formik.handleChange}
              valueStateMessage={<div>{formik.errors.task}</div>}
              valueState={formik.errors.task ? 'Error' : 'None'}
            >
              {presets.map((preset) => (
                <ComboBoxItem key={preset} text={preset} />
              ))}
            </ComboBox>
          </FormItem>
          <FormItem label="Description">
            <Input
              name="description"
              placeholder="Description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleChange}
              valueStateMessage={<div>{formik.errors.description}</div>}
              valueState={formik.errors.description ? 'Error' : 'None'}
            />
          </FormItem>
          <FormItem label="Priority">
            <StepInput
              name="priority"
              placeholder="Priority"
              value={formik.values.priority}
              onChange={formik.handleChange}
              onBlur={formik.handleChange}
              valueStateMessage={<div>{formik.errors.priority}</div>}
              valueState={formik.errors.priority ? 'Error' : 'None'}
            />
          </FormItem>
          <FormItem label="Due date">
            <DatePicker
              name="deadline"
              formatPattern="yyyy-MM-dd"
              value={formik.values.deadline}
              onChange={formik.handleChange}
              onBlur={formik.handleChange}
              valueStateMessage={<div>{formik.errors.deadline}</div>}
              valueState={formik.errors.deadline ? 'Error' : 'None'}
            />
          </FormItem>
          <FormItem>
            {createPortal(
              <ContactDialog opened={dialogOpened} onAssignContact={assignTodo}></ContactDialog>,
              document.body
            )}
            <Button onClick={() => setDialogOpened(!dialogOpened)}>
              {assigned ? assigned.firstName + ' ' + assigned.lastName : 'Assign'}
            </Button>
            <Button design="Emphasized" disabled={formik.isSubmitting} onClick={formik.submitForm}>
              Add
            </Button>
          </FormItem>
        </Form>
      </div>
      <div className="m-m shadow-s p-s">
        <div className="flex flex-col gap-s">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onChangeStatus={(todo, value) => changeStatus(todo, value)}></TodoItem>
          ))}
        </div>
        <Button id="delete-btn" design="Attention" className="mt-m" disabled={noDone()} onClick={remove}>
          Remove<Tooltip position="end-bottom" for="delete-btn" text="Remove todos that are done"></Tooltip>
        </Button>
      </div>
    </>
  );
}

type TodoProps = {
  todo: Todo;
  onChangeStatus: (todo: Todo, value: boolean | undefined) => void;
};

export function TodoItem({ todo, onChangeStatus }: TodoProps): JSX.Element {
  return (
    <>
      <Card
        header={
          <CardHeader
            titleText={todo.task}
            subtitleText={todo.description + ' / ' + todo.assigned?.firstName + ' ' + todo.assigned?.lastName}
            status={'' + todo.priority}
          />
        }
      >
        <CheckBox
          text="Done"
          checked={todo.done}
          onChange={(event) => onChangeStatus(todo, (event.currentTarget as CheckBoxDomRef).checked)}
        ></CheckBox>
        <Tooltip position="start-bottom" slot="tooltip" text="Done"></Tooltip>
      </Card>
    </>
  );
}
