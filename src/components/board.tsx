import * as React from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import styled from 'styled-components'
import NewItemForm from './new-item-form'

// Import data for board
import { initialBoardData } from '../data/board-initial-data'

// Import BoardColumn component
import { BoardColumn } from './board-column'

// Create styles board element properties
const BoardEl = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`

export class Board extends React.Component {
  // Initialize board state with board data
  state = initialBoardData

  
  // Handle drag & drop
  onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result
    console.log(result)
    // Do nothing if item is dropped outside the list
    if (!destination) {
      return
    }

    // Do nothing if the item is dropped into the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    if (draggableId.includes('column')) {
      const shufColOrder = this.state.columnsOrder
      console.log("Columns order", shufColOrder, "draggableId", draggableId, "FROM SOURCE: ", source.index, "TO", destination.index)
      shufColOrder.splice(source.index, 1)
      shufColOrder.splice(destination.index, 0, draggableId)

      const newState = {
        ...this.state,
        columnsOrder: shufColOrder
      }
      this.setState(newState)
      console.log("New Columns order", newState.columnsOrder)
      return
    }

    // Find column from which the item was dragged from
    const columnStart = (this.state.columns as any)[source.droppableId]

    // Find column in which the item was dropped
    const columnFinish = (this.state.columns as any)[destination.droppableId]

    // Moving items in the same list
    if (columnStart === columnFinish) {
      // Get all item ids in currently active list
      const newItemsIds = Array.from(columnStart.itemsIds)

      // Remove the id of dragged item from its original position
      newItemsIds.splice(source.index, 1)

      // Insert the id of dragged item to the new position
      newItemsIds.splice(destination.index, 0, draggableId)

      // Create new, updated, object with data for columns
      const newColumnStart = {
        ...columnStart,
        itemsIds: newItemsIds
      }

      // Create new board state with updated data for columns
      const newState = {
        ...this.state,
        columns: {
          ...this.state.columns,
          [newColumnStart.id]: newColumnStart
        }
      }

      // Update the board state with new data
      this.setState(newState)
    } else {
      // Moving items from one list to another
      // Get all item ids in source list
      const newStartItemsIds = Array.from(columnStart.itemsIds)

      // Remove the id of dragged item from its original position
      newStartItemsIds.splice(source.index, 1)

      // Create new, updated, object with data for source column
      const newColumnStart = {
        ...columnStart,
        itemsIds: newStartItemsIds
      }

      // Get all item ids in destination list
      const newFinishItemsIds = Array.from(columnFinish.itemsIds)

      // Insert the id of dragged item to the new position in destination list
      newFinishItemsIds.splice(destination.index, 0, draggableId)

      // Create new, updated, object with data for destination column
      const newColumnFinish = {
        ...columnFinish,
        itemsIds: newFinishItemsIds
      }

      // Create new board state with updated data for both, source and destination columns
      const newState = {
        ...this.state,
        columns: {
          ...this.state.columns,
          [newColumnStart.id]: newColumnStart,
          [newColumnFinish.id]: newColumnFinish
        }
      }

      // Update the board state with new data
      this.setState(newState)
    }
  }

  //get the index associated with the last item on the list
  getLastItem = () => {
    const allItems = Object.keys(this.state.items)
    const lastItem = allItems[allItems.length -1]
    //Split at the "-" e.g item-8
    const splitItemName = lastItem.split("-")
    console.log("splitItemName", splitItemName)
    const lastItemNum = splitItemName[splitItemName.length - 1]
    console.log("lastItemNum", lastItemNum)
    // const testString = parseInt("Hello")
    // console.log("TEST HELLO", testString)

    const lastItemNumAsInt = parseInt(lastItemNum)

    if (isNaN(lastItemNumAsInt)) {
      return 1
    }

    return lastItemNumAsInt + 1
  }

  handleAddItem = (event: React.FormEvent, task: string) => {
    event.preventDefault()
    console.log("Hello!", task)
    const index = this.getLastItem()
    // console.log("LAST ITEM NUMBER IS", `${index}: ${task}`)

    const newKey = `item-${index}`
    const targetColumn = this.state.columns["column-1"]

    let newItem = {
      ...this.state,
      items: {
        ...this.state.items,
        [newKey]: {id: `${newKey}`, content: task}
      },
    }

    let itemsIds = targetColumn.itemsIds.push(newKey)
    
    let newItemsIds = {
      ...targetColumn,
      itemsIds: itemsIds
    }

    console.log("NEW ITEMS IDS", newItemsIds)
    if (task !== "") {
      this.setState(newItem)
      this.setState(newItemsIds)
    }
  }

  handleDeleteItem = (event: React.FormEvent, itemId: string, column: any) => {
    console.log("COLUMN", column)
    const stateClone = {...this.state}
    console.log("STATECLONE", stateClone)
    const columns = {...stateClone.columns}
    const items = {...stateClone.items}

    const newColumns = Object.values(columns).map(i => {
      console.log("WHAT IS I", i)
      
      const newItemsIds: string[] = i.itemsIds;
      //If there are items in the column, and the column matches what I've clicked
      if (newItemsIds.length > 0 && i.id === column.id) {
        newItemsIds.splice(newItemsIds.indexOf(itemId), 1);
      }
      return { ...i, itemsIds: newItemsIds }
    })

    console.log("INDEX OF", newColumns )

    const makeArray = Object.entries(items).filter(item => item[1].id !== itemId)
    const newObj = Object.fromEntries(makeArray)
    // this.setState({
    //   ...stateClone,
    //   columns: {
    //     [column.id]: 
    //   }
    // })

    this.setState({
      ...stateClone,
      items: newObj
    })
  }



  render() {
    
    return (
      <>
      <DragDropContext onDragEnd={this.onDragEnd}>
        <NewItemForm handleAddItem={this.handleAddItem}/> 
        <Droppable 
          droppableId="columns"    
          direction="horizontal" 
          type="column">
          {(provided, snapshot) => 
            <BoardEl 
              {...provided.droppableProps}
              ref={provided.innerRef}>
              {this.state.columnsOrder.map((columnId, index) => {
                // Get id of the current column
                const column = (this.state.columns as any)[columnId]

                // Get item belonging to the current column
                const items = column.itemsIds.map((itemId: string) => (this.state.items as any)[itemId])
                // Render the BoardColumn component
                return <BoardColumn 
                    key={column.id} 
                    column={column}
                    items={items}
                    index={index}
                    handleDeleteItem={this.handleDeleteItem}
                    // saveData={this.saveData}
                    />
              })}
              {provided.placeholder}
              </BoardEl>
            } 
            </Droppable>
            
            </DragDropContext>
            </>
    )}
}