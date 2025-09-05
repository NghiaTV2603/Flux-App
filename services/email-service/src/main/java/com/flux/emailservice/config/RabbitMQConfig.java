package com.flux.emailservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Why: Cấu hình RabbitMQ cho event-driven communication
 * Context: Email service lắng nghe events từ các service khác
 */
@Configuration
@EnableRabbit
public class RabbitMQConfig {

    // Why: Exchange name phải match với các service khác trong hệ thống
    public static final String EXCHANGE_NAME = "app.events";
    
    // Why: Queue riêng cho email service để xử lý các email events
    public static final String EMAIL_QUEUE = "email.queue";
    
    // Why: Routing keys để filter events cần thiết
    public static final String USER_CREATED_ROUTING_KEY = "user.created";
    public static final String SERVER_MEMBER_INVITED_ROUTING_KEY = "server.member.invited";
    public static final String SERVER_MEMBER_JOINED_ROUTING_KEY = "server.member.joined";
    public static final String PASSWORD_RESET_ROUTING_KEY = "user.password.reset.requested";
    public static final String SERVER_CREATED_ROUTING_KEY = "server.created";

    /**
     * Why: Topic exchange cho flexible routing với patterns
     * Context: Cho phép routing dựa trên routing key patterns
     */
    @Bean
    public TopicExchange appEventsExchange() {
        return ExchangeBuilder
                .topicExchange(EXCHANGE_NAME)
                .durable(true)
                .build();
    }

    /**
     * Why: Queue để nhận email events với durability
     * Context: Đảm bảo messages không bị mất khi service restart
     */
    @Bean
    public Queue emailQueue() {
        return QueueBuilder
                .durable(EMAIL_QUEUE)
                .withArgument("x-dead-letter-exchange", "email.dlx")
                .build();
    }

    /**
     * Why: Dead letter exchange cho failed messages
     * Context: Messages fail sẽ được route đến đây để debug
     */
    @Bean
    public DirectExchange emailDeadLetterExchange() {
        return ExchangeBuilder
                .directExchange("email.dlx")
                .durable(true)
                .build();
    }

    /**
     * Why: Dead letter queue để store failed messages
     */
    @Bean
    public Queue emailDeadLetterQueue() {
        return QueueBuilder
                .durable("email.dlq")
                .build();
    }

    /**
     * Why: Binding email queue với multiple routing keys
     * Context: Email service cần xử lý nhiều loại events khác nhau
     */
    @Bean
    public Binding userCreatedBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(appEventsExchange())
                .with(USER_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding serverMemberInvitedBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(appEventsExchange())
                .with(SERVER_MEMBER_INVITED_ROUTING_KEY);
    }

    @Bean
    public Binding serverMemberJoinedBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(appEventsExchange())
                .with(SERVER_MEMBER_JOINED_ROUTING_KEY);
    }

    @Bean
    public Binding passwordResetBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(appEventsExchange())
                .with(PASSWORD_RESET_ROUTING_KEY);
    }

    @Bean
    public Binding serverCreatedBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(appEventsExchange())
                .with(SERVER_CREATED_ROUTING_KEY);
    }

    /**
     * Why: Dead letter queue binding
     */
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder
                .bind(emailDeadLetterQueue())
                .to(emailDeadLetterExchange())
                .with("email.dlq");
    }

    /**
     * Why: JSON message converter cho structured event data
     * Context: Events sẽ được gửi dưới dạng JSON objects
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Why: RabbitTemplate với JSON converter
     * Context: Để publish events nếu cần (future use)
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    /**
     * Why: Listener container factory với JSON converter
     * Context: Để consume JSON messages từ queue
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        // Why: Concurrent consumers để xử lý multiple messages cùng lúc
        factory.setConcurrentConsumers(2);
        factory.setMaxConcurrentConsumers(5);
        return factory;
    }
}
