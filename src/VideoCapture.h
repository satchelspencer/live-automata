#include <nan.h>
#include "opencv2/videoio.hpp"

class VideoCapture : public Nan::ObjectWrap
{
  public:
   cv::VideoCapture * cap;

  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  static NAN_METHOD(Read);

  static Nan::Persistent<v8::FunctionTemplate> constructor;

};
