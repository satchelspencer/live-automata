#include <nan.h>

class PipeWriter : public Nan::ObjectWrap
{
  public:
   int fd;


  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  static NAN_METHOD(Write);

  static Nan::Persistent<v8::FunctionTemplate> constructor;

};
