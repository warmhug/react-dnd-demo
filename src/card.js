import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import flow from 'lodash/flow';
import classNames from 'classnames';

let onceInfo = [];

const dSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index,
      bIndex: props.bIndex
    };
  },
  isDragging: function (props, monitor) {
    // 根据id 判断正在拖动的元素，这样Card可以被包裹在另外元素中
    return monitor.getItem().id === props.id;
  },
  endDrag(props, monitor, component) {
    props.onEndDrag();
  }
};

const dTarget = {
  hover(props, monitor, component) {
    const dragInfo = monitor.getItem();
    const dragIndex = dragInfo.index;
    const dragBIndex = dragInfo.bIndex;

    const bIndex = props.bIndex;
    let hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragBIndex === bIndex && dragIndex === hoverIndex) {
      return;
    }

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Determine rectangle on screen
    if (!component) {
      // why no component !!! ???
      return;
    }
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    if (dragBIndex !== bIndex) {
      const k = [dragBIndex, dragIndex, bIndex, hoverIndex].join('-');
      if (onceInfo[0] && onceInfo[0] === k) {
        return;
      }
      onceInfo[0] = k;
      props.onMoveCard(dragBIndex, dragIndex, bIndex, hoverIndex, hoverBoundingRect);
      return;
    }

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }
    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.onMoveCard(dragBIndex, dragIndex, bIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

class Card extends Component {
  static propTypes = {
    getCardHeight: PropTypes.func,
  }
  static defaultProps = {
    getCardHeight: () => {},
  }
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // console.log('cadr did mount', this.props.index, this.props.bIndex, findDOMNode(this).offsetHeight);
    this.props.getCardHeight(findDOMNode(this).offsetHeight);
  }

  render() {
    const { prefixCls, placeholder, className, style, isDragging, isOver, content, connectDragSource, connectDropTarget } = this.props;
    const cls = {
      [`${prefixCls}-card`]: true,
      [`${prefixCls}-card-placeholder`]: placeholder,
      [`${prefixCls}-card-dragging`]: isDragging,
      [`${prefixCls}-card-over`]: isOver,
    };
    return placeholder ? <div className={classNames(cls, className)}>{content}</div> :
      connectDragSource(connectDropTarget(
      <div className={classNames(cls, className)} style={style}>
        {content}
      </div>
    ));
  }
}

export default flow(
  DragSource('dnd', dSource, (connect, monitor) => {
    return {
      connectDragSource: connect.dragSource(),
      // connectDragPreview: connect.dragPreview(),
      isDragging: monitor.isDragging(),
    };
  }),
  DropTarget('dnd', dTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    // canDrop: monitor.canDrop()
  }))
)(Card);
