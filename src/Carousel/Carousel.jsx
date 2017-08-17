import React, { Component, cloneElement } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types'
import { widgetModule } from 'kambi-widget-core-library';
import styles from './Carousel.scss'

// const imgPromise = (url) => {
//    return new Promise((resolve, reject) => {
//       const imageElem = new Image()
//
//       imageElem.onload = () => resolve(imageElem)
//       imageElem.onerror = () => reject('The image failed to load')
//
//       imageElem.src = url
//    })
   // }
//
// const carouselItemsPromise = (items) => {
//    if (!items.every(item => typeof item === 'object')) {
//       console.error('Property carouselItemsArray should contain objects')
//       return
//    }
//
//    return Promise.all(
//       items.map((item) => {
//          if (item.hasOwnProperty('imagePath')) {
//             return imgPromise(item.imagePath)
//          } else {
//             console.error('The key of the image URL in the Object for carouselItemsArray should be "imagePath"')
//          }
//       })
//    ).then(([...items]) => {
//       return items;
//    })
// }

const imagesLoaded = (parentNode) => {
   const imgElements = parentNode.querySelectorAll('img')

   if (imgElements == null || imgElements.length < 1) {
      return false
   }

   imgElements.forEach((img) => {
      if (!img.complete) {
         return false
      }
   })

   return true
}

class Carousel extends Component {

   constructor(props) {
      super(props);
      this.timer;

      this.state = {
         isMouseEntered: false,
         currentPosition: props.selectedItem,
         lastPosition: null,
         carouselItems: null,
         imagesLoaded: false,
         cssAnimation: {},
         itemStyles: {},
         initialized: false,
         itemSize: 0
      }
   }

   componentDidMount() {
      this.setupCarousel()
   }

   componentDidUpdate(prevProps) {
      this.adaptHeight()
   }

   setupCarousel() {
      this.bindEvents()
      this.setupCarouselItems()

      this.setState({
         initialized: true
      }, () => console.log('Carousel is initialized'))
   }

   setupCarouselItems() {
      if (!this.props.children) {
         const itemsArray = this.props.carouselItemsArray

         if (itemsArray != null && Array.isArray(itemsArray)) {
            const items = [...itemsArray, itemsArray[0]]
            this.setState({
               carouselItems: items,
               lastPosition: items.length - 1
            })

         }
      } else {
         const { children } = this.props;
         const items = [...children, children[0]]
         this.setState({
            carouselItems: items,
            lastPosition: items.length - 1
         })
      }

      if (this.props.autoPlay) {
         this.setupAutoPlay()
      }
   }

   bindEvents() {
      window.addEventListener('resize', () => {
         clearTimeout(this.resizeTimeout);
         this.resizeTimeout = setTimeout(() => this.adaptHeight(), 200);
      });
   }

   adaptHeight() {
      if (this.state.carouselItems == null) return null

      const item = this[`item${this.state.currentPosition}`]
      const images = item && item.getElementsByTagName('img') // returns an array

      if (images.length <= 0) {
         return null
      }

      const image = images[0]; // First image in the array
      // should only be one image as each 'item' === each <li> tag

      // Access the image height and width
      const height = image.clientHeight;
      const width = image.clientWidth;

      // Call setWidgetHeight from widgetModule to set the height of the iframe
      widgetModule.setWidgetHeight(
         // Use height/width * window width to maintain aspect ratio
         (height / width) * window.innerWidth
      )
   }

   setupAutoPlay() {
      this.autoPlay()
      const carouselWrapper = this.carouselWrapper

      if (this.props.stopOnHover && carouselWrapper) {
         carouselWrapper.addEventListener('mouseenter', () => {
            console.log('mouseenter');
            this.stopOnHover()
         })
         carouselWrapper.addEventListener('mouseleave', () => {
            console.log('mouseleave');
            this.startOnHoverLeave()
         })
      }
   }

   autoPlay() {
      this.timer = setTimeout(() => {
         this.increment()
      }, this.props.intervalDuration)
   }

   clearAutoPlay() {
      clearTimeout(this.timer)
   }

   resetAutoPlay() {
      this.clearAutoPlay()
      this.autoPlay()
   }

   stopOnHover() {
      this.setState({ isMouseEntered: true })
      this.clearAutoPlay()
   }

   startOnHoverLeave() {
      this.setState({ isMouseEntered: false })
      this.autoPlay()
   }

   decrement(positions) {
      this.moveTo(this.state.currentPosition - (typeof positions === 'Number' ? positions : 1));
   }

   increment(positions) {
      this.moveTo(this.state.currentPosition + (typeof positions === 'Number' ? positions : 1));
   }

   moveTo(position) {
      if (position < 0 ) {
         position = this.props.infiniteLoop ? this.state.lastPosition : 1;
      }

      if (position > this.state.lastPosition) {
         position = this.props.infiniteLoop ? 1 : this.state.lastPosition;
      }

      this.setState({
         // if it's not a slider, we don't need to set position here
         currentPosition: position
      });

      this.setSliderStyles()

      // don't reset auto play when stop on hover is enabled, doing so will trigger a call to auto play more than once
      // and will result in the interval function not being cleared correctly.
      if (this.props.autoPlay && this.state.isMouseEntered === false) {
         this.resetAutoPlay();
      }
   }


   setSliderStyles() {
      const currentPosition = `${-this.state.currentPosition * 100}%`
      let animationObject = {}

      if (this.props.animationType === 'slide') {
         animationObject = {
            transform: `translate3d(${currentPosition}, 0, 0)`,
            transition: `${this.props.transitionDuration}ms ${this.props.cssEase}`
         }

         this.setState({
            cssAnimation: animationObject
         }, () => this.props.onSlide(this.state.currentPosition))

         if (this.state.currentPosition === this.state.lastPosition) {
            // Reset the current slide position back to 0% with no transition
            setTimeout(() => {
               this.setState({
                  cssAnimation: {
                     transform: 'translate3d(0%, 0, 0)',
                     transition: 'none'
                  }
               })
            }, this.props.transitionDuration)
         }

      } else if (this.props.animationType === 'fade') {
         animationObject = {
            transform: 'translate3d(0%, 0, 0)',
         }

         this.setState({
            cssAnimation: animationObject
         }, () => this.props.onSlide(this.state.currentPosition))

         // setTimeout(() => {
         //    animationObject = {
         //       opacity: 1,
         //       transition: `opacity ${this.props.transitionDuration}ms ${this.props.cssEase}`
         //    }
         //    this.setState({ cssAnimation: animationObject })
         // }, this.props.transitionDuration / 2)

      } else {
         console.error(`You used the animation value ${this.props.animationType} which is not currently supported by the carousel. Please use one of 'slide' or 'fade'.`)
      }
   }

   imageChangeHandler() {
      const carouselWrapper = this.carouselWrapper

      this.setState({
         imagesLoaded: imagesLoaded(carouselWrapper)
      })
   }

   renderImage(item, index) {

      const imgEvents = {
         onLoad: () => this.imageChangeHandler(),
         onError: () => this.imageChangeHandler()
      }

      if (item.hasOwnProperty('imagePath')) {
         return <img
            src={item.imagePath}
            alt={`image item ${index} in the carousel`}
            onLoad={imgEvents.onLoad}
            onError={imgEvents.onError}
         />
      }

      return cloneElement(item, {
         onLoad: imgEvents.onLoad,
         onError: imgEvents.onError
      })
   }

   renderItems() {
      return this.state.carouselItems.map((item, index) => {

         const { itemStyles } = this.state;

         if (this.props.animationType === 'fade') {
            let style = {
               left: `${-index * 100}%`,
               opacity: 0,
               transition: `opacity ${this.props.transitionDuration}ms ${this.props.cssEase}`
            }

            if (this.state.currentPosition === index) {
               style = Object.assign({}, style, {
                  opacity: 1
               })
            }

            this.setState({ itemStyles: style })
         }

         return (
            <li
               key={`item-${index}`}
               className={this.state.currentPosition === index ? 'carousel-item selected' : 'carousel-item'}
               id={`item-${index}`}
               ref={el => this[`item${index}`] = el}
               style={itemStyles}
            >
               {this.renderImage(item, index)}
            </li>
         )
      })
   }

   render () {
      if (this.state.carouselItems == null) {
         return null
      }

      return (
         <div className={this.props.wrapperClassName} ref={el => this.carouselWrapper = el}>
            <div className='carousel-wrapper' style={{ width: this.props.width }}>
               <div className='slider-wrapper'>
                  <ul className='slider' style={this.state.cssAnimation}>
                     {/* Render Carousel Items */}
                     {this.renderItems()}
                  </ul>
               </div>
            </div>
         </div>
      )
   }
}

Carousel.defaultProps = {
   showIndicators: true,
   showArrows: true,
   infiniteLoop: true,
   legendClassName: null,
   wrapperClassName: null,
   cssEase: 'ease',
   animationType: 'fade', // Enum 'slide' or 'fade'
   selectedItem: 0,
   width: '100%',
   autoPlay: true,
   stopOnHover: true,
   intervalDuration: 1500,
   transitionDuration: 350,
   carouselItemsArray: null, // [{ item: 'blah', }]
   redirectURL: null,
   redirectCallback: () => {},
   onSlide: (currentPos) => { }
}

Carousel.propTypes = {
   children: PropTypes.node
};

Carousel.displayName = 'Carousel'

export default Carousel;
