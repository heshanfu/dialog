'use strict';

var React = require('react');
var domAlign = require('dom-align');
var RcUtil = require('rc-util');
var KeyCode = RcUtil.KeyCode;
var Dom = RcUtil.Dom;
var assign = require('object-assign');
var anim = require('css-animation');

function prefixClsFn(prefixCls) {
  var args = Array.prototype.slice.call(arguments, 1);
  return args.map(function (s) {
    if (!s) {
      return prefixCls;
    }
    return prefixCls + '-' + s;
  }).join(' ');
}

function buffer(fn, ms) {
  var timer;
  return function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, ms);
  };
}

var Dialog = React.createClass({
  align() {
    var align = this.props.align;
    domAlign(React.findDOMNode(this.refs.dialog), align.node || window, align);
  },

  monitorWindowResize() {
    if (!this.resizeHandler) {
      this.resizeHandler = Dom.addEventListener(window, 'resize', buffer(this.align, 80));
    }
  },

  anim(el, transitionName, animation, enter, fn) {
    var props = this.props;
    if (!transitionName && animation) {
      transitionName = `${props.prefixCls}-${animation}`;
    }
    if (transitionName) {
      anim(el, transitionName + (enter ? '-enter' : '-leave'), fn);
    } else if (fn) {
      fn();
    }
  },

  unMonitorWindowResize() {
    if (this.resizeHandler) {
      this.resizeHandler.remove();
      this.resizeHandler = null;
    }
  },

  componentDidMount() {
    this.componentDidUpdate();
  },

  componentDidUpdate(prevProps) {
    var props = this.props;
    var dialogDomNode = React.findDOMNode(this.refs.dialog);
    var maskNode = React.findDOMNode(this.refs.mask);
    prevProps = prevProps || {};
    if (props.visible) {
      this.monitorWindowResize();
      // first show
      if (!prevProps.visible) {
        this.align();
        this.anim(maskNode, props.maskTransitionName, props.maskAnimation, true);
        this.anim(dialogDomNode, props.transitionName, props.animation, true, () => {
          props.onShow();
        });
        this.lastOutSideFocusNode = document.activeElement;
        dialogDomNode.focus();
      } else if (props.align !== prevProps.align) {
        this.align();
      }
    } else {
      if (prevProps.visible) {
        this.anim(maskNode, props.maskTransitionName, props.maskAnimation);
        this.anim(dialogDomNode, props.transitionName, props.animation, false, ()=> {
          props.onClose();
          if (props.mask && this.lastOutSideFocusNode) {
            try {
              this.lastOutSideFocusNode.focus();
            } catch (e) {
              // empty
            }
            this.lastOutSideFocusNode = null;
          }
        });
      }
      this.unMonitorWindowResize();
    }
  },

  componentWillUnmount() {
    this.unMonitorWindowResize();
  },

  handleKeyDown(e) {
    var props = this.props;
    if (props.closable) {
      if (e.keyCode === KeyCode.ESC) {
        this.props.onRequestClose();
      }
    }
    // keep focus inside dialog
    if (props.visible) {
      if (e.keyCode === KeyCode.TAB) {
        var activeElement = document.activeElement;
        var dialogRoot = React.findDOMNode(this.refs.dialog);
        var sentinel = React.findDOMNode(this.refs.sentinel);
        if (e.shiftKey) {
          if (activeElement === dialogRoot) {
            sentinel.focus();
          }
        } else if (activeElement === React.findDOMNode(this.refs.sentinel)) {
          dialogRoot.focus();
        }
      }
    }
  },

  handleMaskClick() {
    if (this.props.closable) {
      this.props.onRequestClose();
    }
    React.findDOMNode(this.refs.dialog).focus();
  },

  render() {
    var props = this.props;
    var visible = props.visible;
    var prefixCls = props.prefixCls;
    var className = [prefixClsFn(prefixCls, 'wrap')];
    var closable = props.closable;
    if (!visible) {
      className.push(prefixClsFn(prefixCls, 'wrap-hidden'));
    }
    var dest = {};
    if (props.width !== undefined) {
      dest.width = props.width;
    }
    if (props.height !== undefined) {
      dest.height = props.height;
    }
    if (props.zIndex !== undefined) {
      dest.zIndex = props.zIndex;
    }

    var style = assign({}, props.style, dest);

    var maskProps = {
      onClick: this.handleMaskClick
    };
    var dialogProps = {
      className: [prefixCls, props.className].join(' '),
      tabIndex: '0',
      role: 'dialog',
      ref: 'dialog',
      style: style,
      onKeyDown: this.handleKeyDown
    };

    if (style.zIndex) {
      maskProps.style = {zIndex: style.zIndex};
    }
    var footer;
    if (props.footer) {
      footer = (<div className={prefixClsFn(prefixCls, 'footer')}>{props.footer}</div>);
    }
    var header;
    if (props.title || closable) {
      header = <div className={prefixClsFn(prefixCls, 'header')}>
            {closable ?
              (<a tabIndex="0" onClick={props.onRequestClose} className={[prefixClsFn(prefixCls, 'close')].join('')}>
                <span className={prefixClsFn(prefixCls, 'close-x')}></span>
              </a>) :
              null}
        <div className={prefixClsFn(prefixCls, 'title')}>{props.title}</div>
      </div>;
    }
    return (<div className={className.join(' ')}>
    {props.mask ? <div {...maskProps} className={prefixClsFn(prefixCls, 'mask')} ref="mask"/> : null}
      <div {...dialogProps}>
        <div className={prefixClsFn(prefixCls, 'content')}>
          {header}
          <div className={prefixClsFn(prefixCls, 'body')}>{props.children}</div>
          {footer}
        </div>
        <div tabIndex="0" ref='sentinel' style={{width: 0, height: 0, overflow: 'hidden'}}>sentinel</div>
      </div>

    </div>);
  }
});

module.exports = Dialog;
