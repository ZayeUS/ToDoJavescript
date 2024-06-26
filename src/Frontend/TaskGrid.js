import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Checkbox,
  IconButton,
  Flex,
  Heading,
  useDisclosure,

  Button,
  Spinner,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { getListData, editItem, addItem, deleteItem, deleteList } from '../Backend/Graphql_helper';
import TaskEditModal from './TaskEditModal';
import TaskAddButton from './AddTaskButton';

const TaskGrid = () => {
  const [listData, setListData] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentListId, setCurrentListId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteListId, setDeleteListId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await getListData();
      setListData(response.data.list);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch list data:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (task, listId) => {
    setCurrentListId(listId);
    setCurrentTask(task);
    onOpen();
  };

  const handleSave = async () => {
    setIsModalLoading(true);
    try {
      await editItem(currentTask.itemid, currentTask.itemname, currentListId, currentTask.statusid);
      fetchData();
      onClose();
      setIsModalLoading(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setIsModalLoading(false);
    }
  };

  const handleDeleteClick = (itemId) => {
    setDeleteTaskId(itemId);
    setIsDeleting(false)
    onAlertOpen();
  };

  const handleDeleteListClick = (listId) => {
    setDeleteListId(listId);
    onAlertOpen();
  };

  const confirmDelete = async () => {
    try {
      if (deleteTaskId) {
        await deleteItem(deleteTaskId);
      }
      if (deleteListId) {
        await deleteList(deleteListId);
      }
      fetchData();
      setDeleteTaskId(null);
      setDeleteListId(null);
      toast({
        title: deleteTaskId ? 'Task deleted.' : 'List deleted.',
        description: deleteTaskId ? 'The task has been deleted successfully.' : 'The list has been deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onAlertClose();
    } catch (error) {
      console.error('Failed to delete:', error);
      setIsDeleting(false);
      toast({
        title: 'Error.',
        description: deleteTaskId ? 'Failed to delete the task.' : 'Failed to delete the list.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onAlertClose();
    }
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="teal.500" />
        <Text ml={4} fontSize="lg" color="teal.500">
          Loading...
        </Text>
      </Flex>
    );
  }

  return (
    <>
      <SimpleGrid columns={[1, 2, 3]} spacing={6} p={5}>
        {listData.map((list) => {
          const notDoneTasks = list.item_collection.filter((task) => task.statusid !== 3);
          const doneTasks = list.item_collection.filter((task) => task.statusid === 3);

          return (
            <Box
              key={list.listid}
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg="gray.100"
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" mb={4} color="teal.600">
                  {list.listname}
                </Heading>
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label="Delete List"
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteListClick(list.listid)}
                />
              </Flex>
              {[...notDoneTasks, ...doneTasks].map((task) => (
                <Box
                  key={task.itemid}
                  mb={4}
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={task.statusid === 3 ? 'green.50' : 'white'}
                  borderColor={task.statusid === 3 ? 'green.200' : 'teal.200'}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Checkbox isChecked={task.statusid === 3} colorScheme="teal">
                      <Text as={task.statusid === 3 ? 's' : 'span'} color={task.statusid === 3 ? 'green.600' : 'gray.800'}>
                        {task.status_value.statusname}
                      </Text>
                    </Checkbox>
                    <Flex>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit Task"
                        size="sm"
                        mr={2}
                        colorScheme="blue"
                        onClick={() => handleEditClick(task, parseInt(list.listid))}
                      />
                      <IconButton
                        icon={isDeleting && (deleteTaskId === task.itemid || deleteListId === list.listid) ? <Spinner size="sm" thickness="2px" speed="0.65s" color="red.500" /> : <DeleteIcon />}
                        aria-label="Delete Task"
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(task.itemid)}
                        isDisabled={isDeleting && (deleteTaskId === task.itemid || deleteListId === list.listid)}
                      />
                    </Flex>
                  </Flex>
                  <Text mt={2} color={task.statusid === 3 ? 'green.600' : 'gray.700'}>
                    {task.itemname}
                  </Text>
                </Box>
              ))}
            </Box>
          );
        })}
      </SimpleGrid>
      {currentTask && (
        <TaskEditModal
          isOpen={Boolean(currentTask)}
          onClose={() => setCurrentTask(null)}
          task={currentTask}
          listId={currentListId}
          fetchData={fetchData}
          listData={listData} // Pass the list data to TaskEditModal
        />
      )}
      <TaskAddButton fetchData={fetchData} listData={listData} />
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {deleteTaskId ? 'Delete Task' : 'Delete List'}
            </AlertDialogHeader>

            <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancel
              </Button>

              <Button colorScheme="red" onClick={confirmDelete} ml={3} >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default TaskGrid;
