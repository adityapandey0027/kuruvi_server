import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

export const bannerData = [
  { id: 1, url: "https://rukminim1.flixcart.com/flap/3376/560/image/d117a62eb5fbb8e1.jpg?q=50" },
  { id: 2, url: "https://rukminim1.flixcart.com/flap/3376/560/image/57267a180af306fe.jpg?q=50" },
  { id: 3, url: "https://rukminim1.flixcart.com/flap/3376/560/image/ae9966569097a8b7.jpg?q=50" },
  { id: 4, url: "https://rukminim1.flixcart.com/flap/3376/560/image/f6202f13b6f89b03.jpg?q=50" }
];

const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
};

function BannerSlider() {
  return (
    <div className="w-full relative group overflow-hidden rounded-md shadow-md">

      <Carousel
        responsive={responsive}
        swipeable
        draggable={false}
        infinite
        autoPlay
        autoPlaySpeed={4000}
        keyBoardControl
        slidesToSlide={1}
        containerClass="carousel-container"
        itemClass="carousel-item"
      >
        {bannerData.map((data) => (
          <div key={data.id} className="relative w-full">
            
            <img
              src={data.url}
              alt="banner"
              className="w-full h-[280px] md:h-[360px] object-cover transition-transform duration-700 hover:scale-105"
            />

            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

          </div>
        ))}
      </Carousel>

    </div>
  );
}

export default BannerSlider;