#include <nan.h>
#include "opencv2/videoio.hpp"

class VideoWriter : public Nan::ObjectWrap
{
  public:
   cv::VideoWriter * writer;

  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  static NAN_METHOD(Write);

  static Nan::Persistent<v8::FunctionTemplate> constructor;

};
